const { CONSTANTS } = require("./constants");

const searchOrderPancakeById = async (id) => {
	try {
		const url = `
https://pos.pages.fm/api/v1/shops/2150225/orders/get_orders?access_token=${CONSTANTS.accessTokenPancakes}&page_size=30&status=-1&page=1&updateStatus=inserted_at&editorId=none&option_sort=inserted_at_desc&es_only=true`;
		const apiSearchPos = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				search: id,
			}),
		});
		const dataApi = await apiSearchPos.json();
		const dataOrderSearch = dataApi?.data ? dataApi.data[0] : {};
		if (dataOrderSearch) {
			return dataOrderSearch;
		}
		return null;
	} catch (error) {
		console.error("Error:", error);
	}
};
/**
 * update đơn pancake theo id lấy từ tiktok
 * @param {*} dataUpdateTag
 * @param {*} idOrder
 * @param {*} accessTokenPancake
 * @returns
 */
const updateDataPancakeById = async (dataUpdateTag, idOrder) => {
	try {
		const formData = new FormData();

		function appendComplexData(prefix, data) {
			for (const [key, value] of Object.entries(data)) {
				const fullKey = prefix ? `${prefix}[${key}]` : key;
				if (typeof value === "object" && value !== null) {
					appendComplexData(fullKey, value);
				} else {
					if (value !== null) {
						formData.append(
							fullKey,
							value ? value.toString() : value
						);
					}
				}
			}
		}

		const seller = {
			assigning_seller: {
				email: "nnminh.devv@gmail.com",
				id: "d27fe058-2df6-47e9-8028-20f8897a752c",
				name: "Nguyễn Ngọc",
			},
			cacheKey: "ad29-a718-b092-fa8e-6ae4-150f-e5d3",
			total_discount_confirm: 0,
			change_info_partner: false,
			change_partner: false,
		};

		const statusUpdateOrder = {};

		appendComplexData("order", {
			...dataUpdateTag,
			...statusUpdateOrder,
			...seller,
		});

		const urlCallApi = `https://pos.pages.fm/api/v1/shops/2150225/orders/${dataUpdateTag?.id}?access_token=${CONSTANTS.accessTokenPancakes}`;
		const response = await fetch(urlCallApi, {
			method: "PUT",
			body: formData,
		});
		if (!response.ok) {
			console.log(
				"Lỗi :::: Cập nhật thông tin không thành công đơn hàng id :::: ",
				idOrder,
				response?.statusText
			);
			return false;
		}

		const data = await response.json();
		console.log("Cập nhật thông tin thành công đơn hang id :::: ", idOrder);
		return data;
	} catch (error) {
		console.error("Error When Update Tag:", error);
	}
};
module.exports = {
	searchOrderPancakeById,
	updateDataPancakeById,
};
