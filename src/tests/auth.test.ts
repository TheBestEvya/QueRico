import initApp from "../server";
import request from "supertest";
import mongoose from "mongoose";
import { Express } from "express";
import { User as userModel,IUser } from "../models/userModel";
import jwt from "jsonwebtoken";

var app: Express;

beforeAll(async () => {
  console.log("beforeAll");
  app = await initApp();
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
        const response = await request(app).post(baseUrl + "/register").send(testUser);
        expect(response.statusCode).toBe(201);
    });
    // בדיקת רישום מוצלח עם בדיקת מבנה התשובה
test("Auth test register - successful response structure", async () => {
  const newUser = {
    name: "Test Response",
    email: "response@test.com",
    password: "responsepassword"
  };
  
  const response = await request(app).post(baseUrl + "/register").send(newUser);
  
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
  const response = await request(app).post(baseUrl + "/register").send(testUser);
  
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
  
  const response = await request(app).post(baseUrl + "/register").send(invalidEmailUser);
  expect(response.statusCode).not.toBe(201);
});

// בדיקת רישום עם שדות חסרים
test("Auth test register - missing fields", async () => {
  const missingFieldsUser = {
    email: "missing@test.com"
    // חסר שם וסיסמה
  };
  
  const response = await request(app).post(baseUrl + "/register").send(missingFieldsUser);
  expect(response.statusCode).not.toBe(201);
});




    test("Auth test login", async () => {
    const response = await request(app).post(baseUrl + "/login").send({email : testUser.email ,password : testUser.password});
    expect(response.statusCode).toBe(200);
    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user).toBeDefined();
    });
    test("Auth test login - fail", async () => {
    const response = await request(app).post(baseUrl + "/login").send({email : "email" ,password : testUser.password});
    expect(response.statusCode).toBe(401);
    });

    // בדיקת התחברות עם סיסמה שגויה
test("Auth test login - wrong password", async () => {
  const response = await request(app).post(baseUrl + "/login").send({
    email: testUser.email,
    password: "wrongpassword123"
  });
  expect(response.statusCode).toBe(401);
  expect(response.body.message).toBe('Invalid credentials');
});

// בדיקת מבנה התשובה המלא בהתחברות מוצלחת
test("Auth test login - response structure", async () => {
  const response = await request(app).post(baseUrl + "/login").send({
    email: testUser.email,
    password: testUser.password
  });
  
  expect(response.statusCode).toBe(200);
  
  // בדיקת מבנה התשובה
  expect(response.body).toHaveProperty('user');
  expect(response.body.user).toHaveProperty('id');
  expect(response.body.user).toHaveProperty('name');
  expect(response.body.user).toHaveProperty('email');
  expect(response.body.user).toHaveProperty('profileImage');
  expect(response.body).toHaveProperty('accessToken');
  expect(response.body).toHaveProperty('refreshToken');
  
  // בדיקת תוכן הנתונים
  expect(response.body.user.email).toBe(testUser.email);
});

// בדיקה שהרפרש טוקן מתעדכן במסד הנתונים
test("Auth test login - refresh token updated", async () => {
  const response = await request(app).post(baseUrl + "/login").send({
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
  const responseNoEmail = await request(app).post(baseUrl + "/login").send({
    password: testUser.password
  });
  expect(responseNoEmail.statusCode).not.toBe(200);
  
  // חסרה סיסמה
  const responseNoPassword = await request(app).post(baseUrl + "/login").send({
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
  
  const response = await request(app).post(baseUrl + "/login").send({
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
    const registerResponse = await request(app).post(baseUrl + "/register").send(testUser2);
    expect(registerResponse.statusCode).toBe(201);

// נתחבר כדי לקבל רענון טוקן
const loginResponse = await request(app).post(baseUrl + "/login").send({
  email: testUser2.email,
  password: testUser2.password
});

expect(loginResponse.statusCode).toBe(200);
refreshToken = loginResponse.body.refreshToken;
  // בדיקת חידוש תקין של טוקן
    const response = await request(app).post(baseUrl + '/refresh-token').send({ refreshToken });
    console.log(response.body)
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("accessToken");
    expect(response.body).toHaveProperty("refreshToken");
    expect(response.body.refreshToken).not.toBe(refreshToken); // מוודא שהטוקן השתנה
  });

  // בדיקת חידוש טוקן ללא שליחתו
  test("Refresh token - missing token", async () => {
    const response = await request(app).post(baseUrl + "/refresh-token").send({});
    
    expect(response.statusCode).toBe(401);
    expect(response.body.message).toBe("Refresh token required");
  });

  // בדיקת חידוש עם טוקן לא תקף
  test("Refresh token - invalid token", async () => {
    const response = await request(app).post(baseUrl + "/refresh-token").send({ refreshToken: "invalid_token" });
    
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

    const response = await request(app).post(baseUrl + "/refresh-token").send({ refreshToken });

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

    const response = await request(app).post(baseUrl + "/refresh-token").send({ refreshToken: expiredToken });

    expect(response.statusCode).toBe(403);
    expect(response.body.message).toBe("Invalid refresh token");

    // נבדוק שהטוקן הוסר מהמשתמש (אם קיים במערכת)
    const user = await userModel.findOne({ refreshToken: expiredToken });
    expect(user).toBeNull();
  });
});


});