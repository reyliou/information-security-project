const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
  logging: false, // 關閉日誌
});

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  otpSecret: {
    type: DataTypes.STRING,
    allowNull: true, // 可選，啟用 2FA 時設置
  },
  is2FAEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

module.exports = { sequelize, User };