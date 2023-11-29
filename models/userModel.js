const mongoose = require("mongoose")
const validator = require("validator")
const bcrypt = require("bcryptjs")


const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide email"],
    validate: {
      validator: validator.isEmail,
      message: "Please provide valid email",
    },
  },
  password: {
    type: String,
    required: [true, "Please provide password"],
  },
  role: {
    type: String,
    enum: ["admin", "manager", "user"],
    default: "user",
  },
  address: {
    type: String,
    default: "137/24 Mau Than street, Ninh Kieu district, Can Tho city.",
  },
  phone: {
    type: String,
    default: "0326423996"
  }
}, {
  timestamps: true,
})

const AddressSchema = new mongoose.Schema(
  {
    address_line_2: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    district: {
      type: String,
      required: true,
    },
    ward: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    postal_code: {
      type: String,
      required: true,
    },
    is_default: {
      type: Boolean,
    }
  },
  { timestamps: true, }
);


// Hashed the password before saving the user into database
UserSchema.pre("save", async function () {
  // console.log(this.modifiedPaths());
  // console.log(this.isModified("name"));
  if (!this.isModified("password")) return
  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password)
  return isMatch
}

module.exports = mongoose.model("User", UserSchema)
