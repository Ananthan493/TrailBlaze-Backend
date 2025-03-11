import User from '../models/User.js';

const adminAuth = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: "Authorization failed" });
  }
};

export default adminAuth;
