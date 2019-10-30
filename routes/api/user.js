const express = require('express')
const router = express.Router()
const {check, validationResult } = require('express-validator')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken');
const config = require('config')
const User = require('../../models/User')

//@route    GET api/users
//@desc     Test route
//@access   public

router.get('/',async (req,res)=>{

    const users = await User.find()

    if(!users)
    {
        return  res.status(400).json({
            status:400,
            error:"No data"
        })
    }
    res.status(200).json({
        status:200,
        data:users
    })
})



//@route    post api/users
//@desc     register user
//@access   public

router.post('/',[

    check('name','Name is required').not().isEmpty(),
    check('email','please enter a valid email').isEmail(),
    check('password','password should not be less than 6 character').isLength({min:6}),

], async (req,res)=>{

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {name, email, password} = req.body

    try
    {
    // see if user already exists
        let user = await User.findOne({email})

        if(user)
        {
           return res.status(400).json({
                error:[{message:"User already exists"}]
            })
        }
        // 
        const avatar = gravatar.url(email, {
            s:'200',
            r:'pg',
            d:'mm'
        })
        // 
        user = new User({

            name,
            email,
            avatar,
            password
        })

        // hash the password--------------------------
        const salt = await bcrypt.genSalt(10)

        user.password = await bcrypt.hash(password, salt)

        await user.save()

        // return json web token
        const payload = {

            user: {
                
                id: user.id
            }
        }

        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 360000 },
            (err, token) => {
              if (err) throw err;
              res.json({ token });
            }
          );


        res.status(200).json({
            status:200,
            message:"user registered successfully"
        })
    }
    catch(err)
    {
        console.log(err.message)
        res.status(500).send("server error")
    }
    
    // get users avatar

})







module.exports = router