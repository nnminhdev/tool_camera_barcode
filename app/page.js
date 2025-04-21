"use client";

import { useState } from "react";
import axios from "axios";
import { createWorker } from "tesseract.js";
import { searchOrderPancakeById, updateDataPancakeById } from "../src/utils";
export default function Home() {
	const [isLoading, setIsLoading] = useState(false);
	const [capturedImage, setCapturedImage] = useState(null);
	const [ocrText, setOcrText] = useState("");
	const [isProcessing, setIsProcessing] = useState(false);

	/**
	 * Hàm upload ảnh lên API
	 * @param {File} imageFile - File ảnh chụp được
	 * @returns {Promise<string>} - URL của ảnh đã upload
	 */
	const uploadImage = async (imageFile) => {
		try {
			// Tạo FormData
			const formData = new FormData();
			formData.append("file", imageFile);
			formData.append("width", "1920");
			formData.append("height", "2560");

			// URL API với access token
			const apiUrl =
				"https://pos.pancake.vn/api/v1/contents?access_token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiTmd1eeG7hW4gTmfhu41jICIsImV4cCI6MTc1MTczODc2NiwiYXBwbGljYXRpb24iOjEsInVpZCI6ImQyN2ZlMDU4LTJkZjYtNDdlOS04MDI4LTIwZjg4OTdhNzUyYyIsInNlc3Npb25faWQiOiJ4WTUvQXBRUzhwR2dMUHpaQS9KMTZobko2RVJIbkZjNnFUQ3pRWVRrZkpnIiwiaWF0IjoxNzQzOTYyNzY2LCJmYl9pZCI6bnVsbCwibG9naW5fc2Vzc2lvbiI6bnVsbCwiZmJfbmFtZSI6Ik5ndXnhu4VuIE5n4buNYyAifQ.9GGDMzQo1pDuruh56BERkT7IAI-IG9nWkzE0PlK8_vg";

			// Gửi request POST
			console.log(formData.get("file"));

			const response = await axios.post(apiUrl, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			// Kiểm tra response
			if (response.data) {
				return response.data;
			}
		} catch (error) {
			console.error("Lỗi khi upload ảnh:", error);
		}
	};

	const openCamera = async () => {
		try {
			// Tạo input file ẩn
			const input = document.createElement("input");
			input.type = "file";
			input.accept = "image/*";
			input.capture = "environment"; // Sử dụng camera sau

			// Xử lý khi người dùng chọn ảnh
			input.onchange = async (e) => {
				const file = e.target.files[0];
				if (file) {
					setCapturedImage(file);
					setOcrText(""); // Reset text khi có ảnh mới
					await processImage(file);
				}
			};

			// Kích hoạt input file
			input.click();
		} catch (err) {
			console.error("Lỗi khi mở camera:", err);
			if (err.name === "NotAllowedError") {
				alert(
					"Bạn cần cấp quyền truy cập camera để sử dụng tính năng này. Vui lòng kiểm tra cài đặt quyền của trình duyệt."
				);
			} else {
				alert("Không thể mở camera. Vui lòng thử lại sau.");
			}
		}
	};

	const processImage = async (file) => {
		setIsProcessing(true);
		try {
			const worker = await createWorker("eng");

			// Tạo URL cho ảnh gốc
			const imageUrl = URL.createObjectURL(file);

			// Thực hiện OCR trên ảnh đã xử lý
			const {
				data: { text },
			} = await worker.recognize(imageUrl);

			// Xử lý text
			const cleanText = text.replace(/[\r\n\t ]/g, "");
			const matches = cleanText.match(/\d{9,20}/g);

			if (matches && matches.length > 0) {
				setOcrText(matches[0]);
			} else {
				setOcrText("Không tìm thấy số phù hợp");
			}

			// Giải phóng tài nguyên
			await worker.terminate();
			URL.revokeObjectURL(imageUrl);
		} catch (err) {
			console.error("Lỗi khi xử lý ảnh:", err);
			alert("Có lỗi xảy ra khi đọc nội dung ảnh. Vui lòng thử lại.");
		} finally {
			setIsProcessing(false);
		}
	};

	const processDataImage = (data, url) => {
		return {
			...data,
			note_image: [url],
		};
	};

	const handleDownload = async () => {
		if (!capturedImage) return;

		setIsLoading(true);
		try {
			const responseUploadImage = await uploadImage(capturedImage);
			const url = responseUploadImage?.content_url;
			if (!url) {
				alert("Không tìm thấy URL của ảnh đã upload");
				return;
			}
			if (!ocrText) {
				alert("Không tìm thấy nội dung ảnh");
				return;
			}
			// 578516533320255302
			const searchOrder = await searchOrderPancakeById(
				"578516533320255302"
			);

			if (!searchOrder) {
				alert("Không tìm thấy đơn hàng nào với ID này");
				return;
			}
			const dataUpdateTag = processDataImage(searchOrder, url);
			console.log(dataUpdateTag);
			// Gọi API để cập nhật đơn hàng
			const responseUpdate = await updateDataPancakeById(
				dataUpdateTag,
				ocrText
			);
			if (responseUpdate) {
				alert("Cập nhật đơn hàng thành công");
			} else {
				alert("Cập nhật đơn hàng không thành công");
			}
			// Gửi ảnh lên server
			// await axios.post("/api/upload", formData, {
			// 	headers: {
			// 		"Content-Type": "multipart/form-data",
			// 	},
			// });

			// // Tạo URL để tải ảnh về
			// const url = URL.createObjectURL(capturedImage);
			// const link = document.createElement("a");
			// link.href = url;
			// link.download = "captured_image.jpg";
			// document.body.appendChild(link);
			// link.click();
			// document.body.removeChild(link);
			// URL.revokeObjectURL(url);

			setCapturedImage(null);
			setOcrText("");
		} catch (err) {
			console.error("Lỗi khi xử lý ảnh:", err);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<main className="main-container">
			<div className="card">
				{capturedImage && (
					<div className="image-container">
						<img
							src={
								URL.createObjectURL(capturedImage) ||
								"/placeholder.svg"
							}
							alt="Captured"
							className="captured-image"
						/>
						<div className="expand-button-container">
							<button
								onClick={() =>
									window.open(
										URL.createObjectURL(capturedImage)
									)
								}
								className="expand-button"
								title="Xem ảnh đầy đủ"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="expand-icon"
								>
									<path d="M15 3h6v6"></path>
									<path d="M10 14 21 3"></path>
									<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
								</svg>
							</button>
						</div>
					</div>
				)}

				<div className="content">
					{isProcessing && (
						<div className="processing-indicator">
							<svg
								className="spinner"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								></circle>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
							<span>Đang xử lý ảnh...</span>
						</div>
					)}

					{ocrText && (
						<div className="ocr-container">
							<div className="ocr-box">
								<div className="ocr-header">
									<h3 className="ocr-title">
										Đơn hàng ghi nhận:
									</h3>
								</div>
								<div className="ocr-content">
									<p className="ocr-text">{ocrText}</p>
								</div>
							</div>
						</div>
					)}

					<div className="button-container">
						<div className="camera-button-container">
							<button
								onClick={openCamera}
								className="camera-button"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="24"
									height="24"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="button-icon"
								>
									<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
									<circle cx="12" cy="13" r="3"></circle>
								</svg>
								Mở Camera
							</button>
						</div>

						{capturedImage && (
							<button
								onClick={handleDownload}
								disabled={isLoading}
								className="download-button"
							>
								{isLoading ? (
									<>
										<svg
											className="spinner button-icon"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											></circle>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Đang xử lý...
									</>
								) : (
									<>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="20"
											height="20"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											className="button-icon"
										>
											<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
											<polyline points="7 10 12 15 17 10"></polyline>
											<line
												x1="12"
												y1="15"
												x2="12"
												y2="3"
											></line>
										</svg>
										Tải ảnh lên POS
									</>
								)}
							</button>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}
