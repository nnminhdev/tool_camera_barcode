import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request) {
	try {
		const formData = await request.formData();
		const file = formData.get("image");

		if (!file) {
			return NextResponse.json(
				{ error: "Không tìm thấy file ảnh" },
				{ status: 400 }
			);
		}

		// Tạo thư mục uploads nếu chưa tồn tại
		const uploadDir = path.join(process.cwd(), "public", "uploads");
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}

		// Tạo tên file duy nhất
		const timestamp = Date.now();
		const filename = `capture_${timestamp}.jpg`;
		const filePath = path.join(uploadDir, filename);

		// Lưu file
		const buffer = Buffer.from(await file.arrayBuffer());
		fs.writeFileSync(filePath, buffer);

		return NextResponse.json({
			success: true,
			message: "Ảnh đã được lưu thành công",
			filename: filename,
		});
	} catch (error) {
		console.error("Lỗi khi xử lý upload:", error);
		return NextResponse.json(
			{ error: "Có lỗi xảy ra khi xử lý upload" },
			{ status: 500 }
		);
	}
}
