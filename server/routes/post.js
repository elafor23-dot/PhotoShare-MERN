const express = require("express");
const multer = require("multer");
const path = require("path");
const Post = require("../models/Post");
const jwt = require("jsonwebtoken");

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const protect = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Please login first"
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid token"
        });
    }
};

router.post("/", protect, upload.single("image"), async (req, res) => {
    try {
        const text = req.body.text || "";
        const image = req.file ? `/uploads/${req.file.filename}` : "";

        if (!text.trim() && !image) {
            return res.status(400).json({
                success: false,
                message: "Write something or upload an image"
            });
        }

        const post = await Post.create({
            user: req.userId,
            text,
            image
        });

        res.status(201).json({
            success: true,
            message: "Post created successfully",
            post
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

router.get("/", async (req, res) => {
    try {
        const posts = await Post.find()
            .populate("user", "name email")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            posts
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Edit comment
router.put("/:id", protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        if (post.user.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Not allowed"
            });
        }

        if (typeof req.body.text !== "string") {
            return res.status(400).json({
                success: false,
                message: "Comment is required"
            });
        }

        post.text = req.body.text;
        await post.save();

        res.json({
            success: true,
            message: "Comment updated successfully",
            post
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Delete comment only, keep the image
router.delete("/:id/comment", protect, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({
                success: false,
                message: "Post not found"
            });
        }

        if (post.user.toString() !== req.userId) {
            return res.status(403).json({
                success: false,
                message: "Not allowed"
            });
        }

        post.text = "";
        await post.save();

        res.json({
            success: true,
            message: "Comment deleted successfully",
            post
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
