const jwt = require("jsonwebtoken");
const { User } = require("../../../models");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const refreshSecret = process.env.JWT_REFRESH_SECRET || "defaultRefreshSecret";
    const decoded = jwt.verify(refreshToken, refreshSecret);
    const user = await User.findOne({ iin: decoded.iin });

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const accessToken = jwt.sign(
      { iin: user.iin, role: user.role, id: user._id },
      process.env.JWT_SECRET || "defaultSecretKey",
      { expiresIn: "1h" }
    );

    const nextRefreshToken = jwt.sign(
      { iin: user.iin },
      refreshSecret,
      { expiresIn: "7d" }
    );

    user.refreshToken = nextRefreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken: nextRefreshToken,
    });
  } catch (error) {
    console.error("Refresh token failed:", error.message);
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};
