import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization || req.headers.Authorization;
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({ message: "Unauthorized" });
		}
		const token = authHeader.split(" ")[1];
		const secret = process.env.JWT_SECRET || "";
		const payload = jwt.verify(token, secret);
		req.user = payload;
		return next();
	} catch (err) {
		return res.status(401).json({ message: "Invalid or expired token" });
	}
};

export default auth;
