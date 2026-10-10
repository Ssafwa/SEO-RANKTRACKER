import User from "../models/User.js";
import bcrypt from 'bcrypt';
import jwt from "jsonwebtoken";

// Helper: Generate JWT Token 
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

function publicUser(user) {
    return {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        plan: user.plan,
        analysisCount: user.analysisCount,
    };
}

// ==========================================
// 1. REGISTER USER
// ==========================================
export const register = async (req, res) => {
    try {
        const body = req.body || {};
        const name = typeof body.name === 'string' ? body.name.trim() : '';
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        if (!name || !email || !password || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, message: "Name, valid email, and password are required" });
        }
        if (password.length < 8) {
            return res.status(400).json({ success: false, message: "Password must be at least 8 characters" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        // Hash the password securely
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create and save the new user
        const user = await User.create({
            name,
            email,
            password: hashedPassword // Save the hashed password, not plain text!
        });

        // Generate dynamic session token
        const token = generateToken(user._id);

        return res.status(201).json({ success: true, token, user: publicUser(user) });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: "User already exists" });
        }
        console.error("Register error:", error.message);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// ==========================================
// 2. LOGIN USER
// ==========================================
export const login = async (req, res) => { // Fixed "eqq" typo and added missing "async" keyword
    try {
        const body = req.body || {};
        const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
        const password = typeof body.password === 'string' ? body.password : '';

        // Validation guard
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // Find the user by their unique email
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Check if the submitted password matches the hashed password in MongoDB
        const isMatch = await bcrypt.compare(password, user.password); // Fixed "compaire" spelling typo
        if (!isMatch) {
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Generate token for existing user session
        const token = generateToken(user._id);

        return res.status(200).json({ success: true, token, user: publicUser(user) });

    } catch (error) {
        console.error("Login error:", error.message); // Fixed label context from "Register error" to "Login error"
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

 // get current user
 export const getUser = async (req, res) => { // Fixed "eqq" typo and added missing "async" keyword
    try {
        const user = await User.findById(req.userId);
         if(!user){
            return res.status(400).json({success: false, message: "user not found"})

         }

         res.json({ success: true, user: publicUser(user) });
         

    } catch (error) {
        console.error("det user error:", error.message); // Fixed label context from "Register error" to "Login error"
        return res.status(500).json({ success: false, message: "Server error" });
    }
}
