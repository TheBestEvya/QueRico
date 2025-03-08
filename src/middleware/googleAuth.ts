// import passport from 'passport';
// import dotenv from 'dotenv';
// import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
// import { Request } from 'express';
// import {User , IUser} from '../models/userModel';
// import {generateRefreshToken , generateAccessToken} from '../controllers/authController';


// dotenv.config();


// interface GoogleUser extends IUser {
//   id?: string;
//   name: string;
//   email: string;
// }

// passport.use(
//   new GoogleStrategy(
//     {
//       clientID: process.env.GOOGLE_CLIENT_ID as string,
//       clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
//       callbackURL: process.env.GOOGLE_CALLBACK_URL as string, // maybe there is no need for http://localhost:3001/api
//       passReqToCallback: true,
//     },
//     async (
//       _req: Request,
//       _accessToken: string,
//       _refreshToken: string,
//       profile: Profile,
//       done: (error: any, user?: { user: GoogleUser; accessToken: string; refreshToken: string ;}) => void
//     ) => {
//       try {
//        // Extract user info from Google profile
//        const googleId = profile.id;
//        const name = profile.displayName;
//        const email = profile.emails?.[0].value;
//        const profilePicture = profile.photos?.[0].value;
//        // Check if user already exists
//        let user = await User.findOne({ email });
//        if (!user) {
//          // Auto-register the user if not found
//          user = await User.create({
//            googleId : googleId,
//            name : name,
//            email : email,
//            profileImage : profilePicture
//          });
//        } else {
//         // Update Google ID or profile picture if missing
//         if (!user.googleId) user.googleId = googleId;
//         if (!user.profileImage && profilePicture) user.profileImage = profilePicture;
//         await user.save();
//       }
//        // Generate a accessToken for the user
//        const accessToken = generateAccessToken(user._id.toString());
//        const refreshToken = generateRefreshToken(user._id.toString());
//         await User.findByIdAndUpdate(user._id, { refreshToken });

//         return done(null, { user, accessToken, refreshToken});
//      } catch (error) {
//        return done(error);
//      }
//    }
//  )
// );

// export default passport;