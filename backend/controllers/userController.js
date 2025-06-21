const User = require('../models/User');

const uploadDocuments = async (req, res) => {
  try {
    const { id } = req.user;
    const updateData = {};
    if (req.files.idProof) {
      updateData.idProof = req.files.idProof[0].path;
    }
    if (req.files.license) {
      updateData.license = req.files.license[0].path;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: 'No documents uploaded' });
    }
    
    updateData.isVerified = false; // Reset verification status on new upload

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    res.json({ message: 'Documents uploaded successfully. Awaiting verification.', user });
  } catch (error) {
    res.status(500).json({ message: 'Error uploading documents', error: error.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

const updateUserProfile = async (req, res) => {
  const { name, email, phone, bio, location } = req.body;
  
  try {
    const user = await User.findById(req.user.id);

    if (user) {
      user.name = name || user.name;
      user.email = email || user.email;
      user.phone = phone || user.phone;
      user.bio = bio || user.bio;
      user.location = location || user.location;
      // Note: Avatar update would be handled in a separate upload endpoint
      
      const updatedUser = await user.save();
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  uploadDocuments,
  getUserProfile,
  updateUserProfile
};
