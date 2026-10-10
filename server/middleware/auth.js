import jwt from "jsonwebtoken"

const auth = async (req, res, next) => {
     try {
        const authHeader = req.headers.authorization

        if(!authHeader || !authHeader.startsWith("Bearer ")){
            return res.status(401).json({success: false, message: "Not authorized, no token"});
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        // ✅ FIXED: Changed decoded.Id to decoded.id to match your controller payload
        req.userId = decoded.id;
        next()
     } catch {
         return res.status(401).json({success: false, message: "Not authorized, invalid token"});
     }
}

export default auth;