import "./globals.css";

export const metadata = {
	title: "Camera Capture",
	icons: {
		icon: "/favicon.ico",
	},
	description: "Camera Capture",
};

export default function RootLayout({ children }) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
