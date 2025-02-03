import { Router } from "express";
import { registerUser,logInUser, logOutUser } from "../controllers/user.controller.js";
// register par jaane se pehle we need ki file handle ho jae jo ki multer krega  and uska middleware bna chuke hai to yha bss call krna hai
import { upload } from "../middlewares/multer.middleware.js";
// ab kyuki upload ek middle ware hai to route par jaane se pehle multer se mil kar jana pdega

import verifyJWT from '../middlewares/auth.middleware.js'


const router=Router();
router.route('/register').post(
    upload.fields([
        // ab iske ander do images hoga avatar and cover page wala
        {name:"avatar", maxCount:1},//name should be same as frontend
        {name:"coverImage", maxCount:1}
    ]),
    registerUser
)

router.route('/login').post(logInUser)
// secured routes
// this verifyJWT middle ware will add user details to the request obj of logoutuser
router.route('/logout').post(verifyJWT,logOutUser)//adding a middleware before logging out

export default router;