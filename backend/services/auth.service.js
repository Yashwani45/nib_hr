// backend/services/auth.service.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/core/user.repository');
const ApiError = require('../utils/apiError');
const { Role } = require('../models');

class AuthService {
  generateTokens(user) {
    const accessToken = jwt.sign(
      { id: user.id, email: user.email },
      process.env.ACCESS_TOKEN_SECRET || 'access_secret_123',
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_123',
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async register(email, password, roleName = 'Employee') {
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      throw new ApiError(400, 'User with this email already exists.');
    }

    const role = await Role.findOne({ where: { roleName } });
    if (!role) {
      throw new ApiError(400, `Requested role '${roleName}' does not exist.`);
    }

    const newUser = await userRepository.create({
      email,
      password,
      roleId: role.id,
    });

    const { accessToken, refreshToken } = this.generateTokens(newUser);
    newUser.refreshToken = refreshToken;
    await newUser.save();

    return {
      userId: newUser.id,
      email: newUser.email,
      role: role.name,
      accessToken,
      refreshToken,
    };
  }

  async login(email, password) {
    const user = await userRepository.findByEmail(email, [{ model: Role, as: 'role' }]);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid email or password.');
    }

    if (!user.isActive) {
      throw new ApiError(403, 'Your account is currently deactivated.');
    }

    const { accessToken, refreshToken } = this.generateTokens(user);
    user.refreshToken = refreshToken;
    await user.save();

    return {
      userId: user.id,
      email: user.email,
      role: user.role?.name || 'Employee',
      accessToken,
      refreshToken,
    };
  }

  async refresh(token) {
    if (!token) {
      throw new ApiError(400, 'Refresh Token is required.');
    }

    try {
      const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET || 'refresh_secret_123');
      const user = await userRepository.findById(decoded.id);
      
      if (!user || user.refreshToken !== token) {
        throw new ApiError(401, 'Invalid or expired Refresh Token.');
      }

      const { accessToken, refreshToken: newRefreshToken } = this.generateTokens(user);
      user.refreshToken = newRefreshToken;
      await user.save();

      return { accessToken, refreshToken: newRefreshToken };
    } catch (err) {
      throw new ApiError(401, 'Invalid Refresh Token.');
    }
  }

  async logout(userId) {
    const user = await userRepository.findById(userId);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    return true;
  }
}

module.exports = new AuthService();
