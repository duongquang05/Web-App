const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const useJsonStore = (process.env.USER_STORE || "db").toLowerCase() === "json";
const userRepository = useJsonStore
  ? require("../repositories/userJsonRepository")
  : require("../repositories/userRepository");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

function generateToken(user) {
  return jwt.sign(
    {
      userId: user.UserID,
      email: user.Email,
      role: user.Nationality || "PARTICIPANT",
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

async function register(req, res, next) {
  try {
    const {
      fullName,
      email,
      password,
      nationality,
      sex,
      birthYear,
      passportNo,
      mobile,
      currentAddress,
    } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "fullName, email, password are required",
      });
    }

    // Check for duplicates
    const existingEmail = await userRepository.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    if (passportNo) {
      const existingPassport =
        await userRepository.findByPassportNo(passportNo);
      if (existingPassport) {
        return res.status(409).json({
          success: false,
          message: "Passport number already registered",
        });
      }
    }

    if (mobile) {
      const existingMobile = await userRepository.findByMobile(mobile);
      if (existingMobile) {
        return res.status(409).json({
          success: false,
          message: "Mobile number already registered",
        });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.createParticipant({
      fullName,
      email,
      passwordHash,
      nationality: nationality || null,
      sex: sex || null,
      birthYear: birthYear || null,
      passportNo: passportNo || null,
      mobile: mobile || null,
      currentAddress: currentAddress || null,
    });

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user.UserID,
          fullName: user.FullName,
          email: user.Email,
          role: user.Nationality === "ADMIN" ? "ADMIN" : "PARTICIPANT",
        },
      },
    });
  } catch (err) {
    // Handle unique constraint violations with friendly messages
    if (err.code === "EREQUEST" && err.message) {
      if (
        err.message.includes("UNIQUE KEY") ||
        err.message.includes("duplicate key")
      ) {
        // Try to identify which field caused the duplicate
        if (
          err.message.includes("PassportNo") ||
          err.message.includes("passport")
        ) {
          return res.status(409).json({
            success: false,
            message: "Passport number already registered",
          });
        }
        if (err.message.includes("Mobile") || err.message.includes("mobile")) {
          return res.status(409).json({
            success: false,
            message: "Mobile number already registered",
          });
        }
        if (err.message.includes("Email") || err.message.includes("email")) {
          return res.status(409).json({
            success: false,
            message: "Email already registered",
          });
        }
        // Generic duplicate key error
        return res.status(409).json({
          success: false,
          message:
            "This information is already registered. Please check your email, passport number, or mobile number.",
        });
      }
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "email and password are required",
      });
    }

    const user = await userRepository.findByEmail(email);
    // Check password hash - try PasswordHash first, fallback to CurrentAddress for backward compatibility
    const passwordHash = user?.PasswordHash || user?.CurrentAddress;
    if (!user || !passwordHash) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const match = await bcrypt.compare(password, passwordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user);

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.UserID,
          fullName: user.FullName,
          email: user.Email,
          role: user.Nationality === "ADMIN" ? "ADMIN" : "PARTICIPANT",
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
};
