import initApp from "../server";
import request from "supertest";
import mongoose from "mongoose";
import { Express } from "express";
import { User as userModel,IUser } from "../models/userModel";
import jwt from "jsonwebtoken";

var app1: Express;

beforeAll(async () => {
  console.log("beforeAll");
  const {app , server} = await initApp();
  app1=app
  await userModel.deleteMany();
//   await postModel.deleteMany();
});
afterAll(async () => {
    console.log("afterAll");
    await mongoose.disconnect();
    // done();
  });


const baseUrl = "/auth";

type User ={
    name? : string,
    email : string;
    password : string,
  accessToken?: string,
  refreshToken?: string
};

const testUser: User = {
    name : "test",
  email: "test@user.com",
  password: "testpassword",
}

describe("Auth Tests", () => {
    test("Auth test register", async () => {
        const response = await request(app1).post(baseUrl + "/register").send(testUser);
        expect(response.statusCode).toBe(201);
    });
    // בדיקת רישום מוצלח עם בדיקת מבנה התשובה
test("Auth test register - successful response structure", async () => {
  const newUser = {
    name: "Test Response",
    email: "response@test.com",
    password: "responsepassword"
  };
  
  const response = await request(app1).post(baseUrl + "/register").send(newUser);
  
  expect(response.statusCode).toBe(201);
  expect(response.body).toHaveProperty('user');
  expect(response.body).toHaveProperty('accessToken');
  expect(response.body).toHaveProperty('refreshToken');
  expect(response.body.user.name).toBe(newUser.name);
  expect(response.body.user.email).toBe(newUser.email);
});

// בדיקת רישום עם אימייל שכבר קיים
test("Auth test register - duplicate email", async () => {
  // ניסיון נוסף לרשום את אותו משתמש
  const response = await request(app1).post(baseUrl + "/register").send(testUser);
  
  expect(response.statusCode).toBe(400);
  expect(response.body).toHaveProperty('message');
  expect(response.body.message).toBe('email already exists');
});

// בדיקת רישום עם אימייל לא תקין
test("Auth test register - invalid email", async () => {
  const invalidEmailUser = {
    name: "Invalid Email",
    email: "notanemail",
    password: "password123"
  };
  
  const response = await request(app1).post(baseUrl + "/register").send(invalidEmailUser);
  expect(response.statusCode).not.toBe(201);
});

// בדיקת רישום עם שדות חסרים
test("Auth test register - missing fields", async () => {
  const missingFieldsUser = {
    email: "missing@test.com"
    // חסר שם וסיסמה
  };
  
  const response = await request(app1).post(baseUrl + "/register").send(missingFieldsUser);
  expect(response.statusCode).not.toBe(201);
});




    test("Auth test login", async () => {
    const response = await request(app1).post(baseUrl + "/login").send({email : testUser.email ,password : testUser.password});
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user).toBeDefined();
    });
    test("Auth test login - fail", async () => {
    const response = await request(app1).post(baseUrl + "/login").send({email : "email" ,password : testUser.password});
    expect(response.statusCode).toBe(401);
    });

    // בדיקת התחברות עם סיסמה שגויה
test("Auth test login - wrong password", async () => {
  const response = await request(app1).post(baseUrl + "/login").send({
    email: testUser.email,
    password: "wrongpassword123"
  });
  expect(response.statusCode).toBe(401);
  expect(response.body.message).toBe('Invalid credentials');
});

// בדיקת מבנה התשובה המלא בהתחברות מוצלחת
test("Auth test login - response structure", async () => {
  const response = await request(app1).post(baseUrl + "/login").send({
    email: testUser.email,
    password: testUser.password
  });
  
  expect(response.statusCode).toBe(200);
  
  // בדיקת מבנה התשובה
  expect(response.body).toHaveProperty('user');
  expect(response.body.user).toHaveProperty('id');
  expect(response.body.user).toHaveProperty('name');
  expect(response.body.user).toHaveProperty('email');
  expect(response.body).toHaveProperty('accessToken');
  expect(response.body).toHaveProperty('refreshToken');
  
  // בדיקת תוכן הנתונים
  expect(response.body.user.email).toBe(testUser.email);
});

// בדיקת רישום עם העלאת תמונת פרופיל
test("Auth test register - with profile image", async () => {
  // יצירת קובץ תמונה פשוט לבדיקה
  const fs = require('fs');
  const path = require('path');
  const tempImagePath = path.join(__dirname, 'test-profile-image.jpg');
  
  // יצירת קובץ בינארי קטן שנראה כמו תמונת JPEG
  const minimalJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
    0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x03, 0x01,
    0x22, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x01, 0x3f, 0x10
  ]);
  fs.writeFileSync(tempImagePath, minimalJpegBuffer);
  
  try {
    // משתמש עם תמונת פרופיל
    const userWithImage = {
      name: "User With Image",
      email: "image-user@test.com",
      password: "imagepassword"
    };
    
    // שליחת הבקשה עם תמונה
    const response = await request(app1)
      .post(baseUrl + "/register")
      .field("name", userWithImage.name)
      .field("email", userWithImage.email)
      .field("password", userWithImage.password)
      .attach("profileImage", tempImagePath);
    
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty('user');
    expect(response.body.user).toHaveProperty('profileImage');
    expect(response.body.user.profileImage).toBeTruthy();
    expect(typeof response.body.user.profileImage).toBe('string');
    expect(response.body.user.profileImage.length).toBeGreaterThan(0);
    
    // בדיקה שהתמונה נשמרה במסד הנתונים
    const userId = response.body.user.id;
    const user = await userModel.findById(userId);
    expect(user).not.toBeNull();
    expect(user?.profileImage).toBeDefined();
    expect(user?.profileImage).toBe(response.body.user.profileImage);
    
    // התחברות עם המשתמש החדש ובדיקה שמקבלים את תמונת הפרופיל
    const loginResponse = await request(app1).post(baseUrl + "/login").send({
      email: userWithImage.email,
      password: userWithImage.password
    });
    
    expect(loginResponse.statusCode).toBe(200);
    expect(loginResponse.body.user).toHaveProperty('profileImage');
    expect(loginResponse.body.user.profileImage).toBe(user?.profileImage);
    
    // ניקוי הקובץ הזמני
    fs.unlinkSync(tempImagePath);
  } catch (error) {
    // ניקוי הקובץ הזמני במקרה של שגיאה
    if (fs.existsSync(tempImagePath)) {
      fs.unlinkSync(tempImagePath);
    }
    throw error;
  }
});

// בדיקה שהרפרש טוקן מתעדכן במסד הנתונים
test("Auth test login - refresh token updated", async () => {
  const response = await request(app1).post(baseUrl + "/login").send({
    email: testUser.email,
    password: testUser.password
  });
  
  expect(response.statusCode).toBe(200);
  expect(response.body).toHaveProperty('refreshToken');
  
  // בדיקה שהרפרש טוקן נשמר במסד הנתונים
  const userId = response.body.user.id;
  const user = await userModel.findById(userId);
  if(user){
  expect(user).not.toBeNull();
  expect(user.refreshToken).toBe(response.body.refreshToken);
}});

// בדיקת התחברות ללא שדות נדרשים
test("Auth test login - missing fields", async () => {
  // חסר אימייל
  const responseNoEmail = await request(app1).post(baseUrl + "/login").send({
    password: testUser.password
  });
  expect(responseNoEmail.statusCode).not.toBe(200);
  
  // חסרה סיסמה
  const responseNoPassword = await request(app1).post(baseUrl + "/login").send({
    email: testUser.email
  });
  expect(responseNoPassword.statusCode).not.toBe(200);
});

// בדיקת טיפול בשגיאות שרת
test("Auth test login - server error handling", async () => {
  // שמירת הפונקציה המקורית
  const originalFindOne = userModel.findOne;
  
  // מוק לפונקציה שזורקת שגיאה
  userModel.findOne = jest.fn().mockImplementationOnce(() => {
    throw new Error('Database error');
  });
  
  const response = await request(app1).post(baseUrl + "/login").send({
    email: testUser.email,
    password: testUser.password
  });
  
  // בדיקה שמוחזר קוד שגיאה 500
  expect(response.statusCode).toBe(500);
  expect(response.body).toHaveProperty('message');
  expect(response.body.message).toBe('Error logging in');
  
  // החזרת הפונקציה המקורית
  userModel.findOne = originalFindOne;
});

describe("Auth Tests - Refresh Token",() => {
  let refreshToken: string;
  const testUser2: User = {
    name : "test2",
  email: "test2@user.com",
  password: "testpassword",
}

  test("Refresh token - successful refresh", async () => {
    const registerResponse = await request(app1).post(baseUrl + "/register").send(testUser2);
    expect(registerResponse.statusCode).toBe(201);

// נתחבר כדי לקבל רענון טוקן
const loginResponse = await request(app1).post(baseUrl + "/login").send({
  email: testUser2.email,
  password: testUser2.password
});

expect(loginResponse.statusCode).toBe(200);
refreshToken = loginResponse.body.refreshToken;
  // בדיקת חידוש תקין של טוקן
    const response = await request(app1).post(baseUrl + '/refresh-token').send({ refreshToken });
    console.log(response.body)
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    expect(response.body.refreshToken).not.toBe(refreshToken); // מוודא שהטוקן השתנה
  });

  // בדיקת חידוש טוקן ללא שליחתו
  test("Refresh token - missing token", async () => {
    const response = await request(app1).post(baseUrl + "/refresh-token").send({});
    
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Refresh token required");
  });

  // בדיקת חידוש עם טוקן לא תקף
  test("Refresh token - invalid token", async () => {
    const response = await request(app1).post(baseUrl + "/refresh-token").send({ refreshToken: "invalid_token" });
    
    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Invalid refresh token");
  });

  // בדיקה האם השרת מטפל בשגיאות פנימיות
  test("Refresh token - server error handling", async () => {
    const originalFindOne = userModel.findOne;

    // יוצרים מצב שהפונקציה תזרוק שגיאה
    userModel.findOne = jest.fn().mockImplementationOnce(() => {
      throw new Error("Database error");
    });

    const response = await request(app1).post(baseUrl + "/refresh-token").send({ refreshToken });

    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Error refreshing token");

    // מחזירים את הפונקציה המקורית
    userModel.findOne = originalFindOne;
  });

  // בדיקה שהטוקן נמחק אם הוא לא תקף
  test("Refresh token - expired token", async () => {
    // ניצור טוקן פג תוקף
    const expiredToken = jwt.sign({ id: "fakeUserId" }, process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key", { expiresIn: "-10s" });

    const response = await request(app1).post(baseUrl + "/refresh-token").send({ refreshToken: expiredToken });

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Invalid refresh token");

    // נבדוק שהטוקן הוסר מהמשתמש (אם קיים במערכת)
    const user = await userModel.findOne({ refreshToken: expiredToken });
    expect(user).toBeNull();
  });
});

describe("Auth Tests - Logout", () => {
  let accessToken: string;
  let refreshToken: string;
  const logoutUser: User = {
    name: "logout",
    email: "logout@user.com",
    password: "logoutpassword",
  };

  // לפני הטסט נרשום ונתחבר עם משתמש בשביל לקבל טוקנים
  beforeAll(async () => {
    const registerResponse = await request(app1).post(baseUrl + "/register").send(logoutUser);
    expect(registerResponse.statusCode).toBe(201);

    const loginResponse = await request(app1).post(baseUrl + "/login").send({
      email: logoutUser.email,
      password: logoutUser.password
    });

    expect(loginResponse.statusCode).toBe(200);
    accessToken = loginResponse.body.accessToken;
    refreshToken = loginResponse.body.refreshToken;
    logoutUser.accessToken = accessToken;
    logoutUser.refreshToken = refreshToken;
  });

  // בדיקת התנתקות מוצלחת
  test("Logout - successful logout", async () => {
    const response = await request(app1)
      .post(baseUrl + "/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send();
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Successfully logged out");
    
    // בודק שהרפרש טוקן נמחק מהמשתמש במסד הנתונים
    const user = await userModel.findOne({ email: logoutUser.email });
    expect(user).not.toBeNull();
    expect(user?.refreshToken).toBe("");
  });

  // בדיקת התנתקות ללא טוקן הרשאה
  test("Logout - missing access token", async () => {
    const response = await request(app1)
      .post(baseUrl + "/logout")
      .send();
    
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("No token provided");
  });

  // בדיקת התנתקות עם טוקן הרשאה לא תקף
  test("Logout - invalid access token", async () => {
    const response = await request(app1)
      .post(baseUrl + "/logout")
      .set("Authorization", "Bearer invalid_token")
      .send();
    
    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Invalid or expired token");
  });

  // בדיקת התנתקות לאחר שכבר התנתקנו - צריך להצליח
  test("Logout - already logged out", async () => {
    // התחברות מחדש כדי לקבל טוקן תקף
    const loginResponse = await request(app1).post(baseUrl + "/login").send({
      email: logoutUser.email,
      password: logoutUser.password
    });
    
    expect(loginResponse.statusCode).toBe(200);
    const newAccessToken = loginResponse.body.accessToken;
    
    // התנתקות פעם ראשונה
    const logoutResponse1 = await request(app1)
      .post(baseUrl + "/logout")
      .set("Authorization", `Bearer ${newAccessToken}`)
      .send();
    
    expect(logoutResponse1.statusCode).toBe(200);
    
    // התנתקות פעם שנייה עם אותו טוקן
    const logoutResponse2 = await request(app1)
      .post(baseUrl + "/logout")
      .set("Authorization", `Bearer ${newAccessToken}`)
      .send();
    
    // האם הטוקן עדיין תקף? תלוי באימפלמנטציה
    // במקרה שהטוקן תקף עד לפקיעתו
    expect(logoutResponse2.statusCode).toBe(200);
  });

  // בדיקת התנתקות עבור משתמש שלא קיים במערכת
  test("Logout - non-existent user", async () => {
    // יצירת טוקן תקף למשתמש שנמחק
    const fakeToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString() }, 
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "15m" }
    );
    
    const response = await request(app1)
      .post(baseUrl + "/logout")
      .set("Authorization", `Bearer ${fakeToken}`)
      .send();
    
    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("User not authenticated");
  });

  // בדיקת התנתקות עם טוקן פג תוקף
  test("Logout - expired token", async () => {
    // יצירת טוקן פג תוקף
    const expiredToken = jwt.sign(
      { id: new mongoose.Types.ObjectId().toString() }, 
      process.env.JWT_SECRET || "your-secret-key", 
      { expiresIn: "-10s" }
    );
    
    const response = await request(app1)
      .post(baseUrl + "/logout")
      .set("Authorization", `Bearer ${expiredToken}`)
      .send();
    
    expect(response.statusCode).toBe(403);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Invalid or expired token");
  });

  // בדיקת טיפול בשגיאות שרת
  test("Logout - server error handling", async () => {
    const originalFindById = userModel.findById;
    
    // מוק לפונקציה שזורקת שגיאה
    userModel.findById = jest.fn().mockImplementationOnce(() => {
      throw new Error("Database error");
    });
    
    const response = await request(app1)
      .post(baseUrl + "/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send();
    
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message");
    expect(response.body.message).toBe("Error logging out");
    
    // החזרת הפונקציה המקורית
    userModel.findById = originalFindById;
  });

  // בדיקת התנהגות אחרי התנתקות - ניסיון לרענן טוקן עם רפרש טוקן שנמחק
  test("Post-logout - refresh token should be invalid", async () => {
    // התחברות מחדש
    const loginResponse = await request(app1).post(baseUrl + "/login").send({
      email: logoutUser.email,
      password: logoutUser.password
    });
    
    expect(loginResponse.statusCode).toBe(200);
    const newAccessToken = loginResponse.body.accessToken;
    const newRefreshToken = loginResponse.body.refreshToken;
    
    // התנתקות
    const logoutResponse = await request(app1)
      .post(baseUrl + "/logout")
      .set("Authorization", `Bearer ${newAccessToken}`)
      .send();
    
    expect(logoutResponse.statusCode).toBe(200);
    
    // ניסיון לרענן טוקן אחרי התנתקות
    const refreshResponse = await request(app1)
      .post(baseUrl + "/refresh-token")
      .send({ refreshToken: newRefreshToken });
    
    expect(refreshResponse.statusCode).toBe(403);
    expect(refreshResponse.body.message).toBe("Invalid refresh token");
  });

 });



});
