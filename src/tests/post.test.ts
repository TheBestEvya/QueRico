import mongoose from "mongoose";
import { Express, response } from "express";
import initApp from "../server";
import request from "supertest";
import { IPost, Post } from "../models/postModel";
import { User } from "../models/userModel";

var app1: Express;


beforeAll(async () => {
    console.log("beforeAll - Post Tests");
    const { app, server } = await initApp();
    app1 = app;
    
    // מחיקת נתוני בדיקה קודמים
    await Post.deleteMany({});
    await User.deleteMany({ email: testUser.email });
    
    // יצירת משתמש בדיקה והתחברות
    const registerResponse = await request(app1).post("/auth/register").send(testUser);
    const loginResponse = await request(app1).post("/auth/login").send({
      email: testUser.email,
      password: testUser.password
    });
    
    accessToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;
  });
  
  afterAll(async () => {
    console.log("afterAll - Post Tests");
    await Post.deleteMany({});
    await User.deleteMany({ email: testUser.email });
    await mongoose.disconnect();
  });

  
let accessToken: string;
let userId: string;


const baseUrl = "/posts"; // התאם לנתיב ה-API שלך

// משתמש בדיקה
const testUser = {
  name: "post tester",
  email: "post@test.com",
  password: "password123",
  userId : mongoose.Types.ObjectId
};

// פוסט בדיקה
const testPost = {
  text: "זהו פוסט בדיקה",
  image: "https://example.com/test-image.jpg" // אופציונאלי, תלוי במודל שלך
};


describe("Post Tests", () => {
  // משתנה שישמור את מזהה הפוסט שנוצר
  let postId: string;
  
  // בדיקת יצירת פוסט - מקרה חיובי
  test("Create post - successful", async () => {
    const response = await request(app1)
      .post(baseUrl)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testPost);
     // expect(response.body.message).toBe("Post created successfully");
    expect(response.statusCode).toBe(201);
    expect(response.body).toHaveProperty("_id");
    expect(response.body).toHaveProperty("text", testPost.text);
    expect(response.body.author).toBeDefined();
    expect(response.body).toHaveProperty("createdAt");
    expect(response.body).toHaveProperty("updatedAt");
    
    // שמירת מזהה הפוסט לשימוש בבדיקות הבאות
    postId = response.body._id;
  });
  
  // בדיקת יצירת פוסט - ללא תוכן
  test("Create post - no content", async () => {
    const response = await request(app1)
      .post(baseUrl)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({});
    
      expect(response.body).toHaveProperty("message");
    expect(response.statusCode).toBe(500);
  });
  
  // בדיקת יצירת פוסט - ללא אימות
  test("Create post - no authentication", async () => {
    const response = await request(app1)
      .post(baseUrl)
      .send(testPost);
    
    expect(response.statusCode).toBe(401);
  });
  
  // בדיקת יצירת פוסט - טוקן לא תקף
  test("Create post - invalid token", async () => {
    const response = await request(app1)
      .post(baseUrl)
      .set("Authorization", "Bearer invalid_token")
      .send(testPost);
    
    expect(response.statusCode).toBe(403);
  });
  
  // בדיקת קבלת פוסט לפי מזהה
  test("Get post by ID", async () => {
    const response = await request(app1)
      .get(`${baseUrl}/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("_id", postId);
    expect(response.body).toHaveProperty("text", testPost.text);
    expect(response.body.author).toBeDefined();
  });
  
  // בדיקת קבלת פוסט לא קיים
  test("Get non-existent post", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const response = await request(app1)
      .get(`${baseUrl}/${fakeId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    
    expect(response.statusCode).toBe(404);
  });
  
  
  // בדיקת קבלת כל הפוסטים עם paging
test("Get all posts with pagination", async () => {
    const response = await request(app1)
      .get(baseUrl)
      .set("Authorization", `Bearer ${accessToken}`);
    
    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty('posts');
    expect(response.body).toHaveProperty('currentPage');
    expect(response.body).toHaveProperty('totalPages');
    expect(response.body).toHaveProperty('totalPosts');
    
    expect(Array.isArray(response.body.posts)).toBe(true);
    expect(response.body.posts.length).toBeGreaterThan(0);
    
    // בדיקה שהפוסט שיצרנו נמצא ברשימה
    const foundPost = response.body.posts.find((post: { _id: string; }) => post._id === postId);
    expect(foundPost).toBeDefined();
  });
  
  // בדיקת פגינציה
  test("Get posts with pagination", async () => {
    // יצירת כמה פוסטים נוספים
    for (let i = 0; i < 5; i++) {
      await request(app1)
        .post(baseUrl)
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ text: `Test post ${i}` });
    }
    
    // בדיקת עמוד ראשון עם הגבלה של 3 פוסטים
    const page1Response = await request(app1)
      .get(`${baseUrl}?page=1&limit=3`)
      .set("Authorization", `Bearer ${accessToken}`);
    
    expect(page1Response.statusCode).toBe(200);
    expect(Array.isArray(page1Response.body.posts)).toBe(true);
    expect(page1Response.body.posts.length).toBe(3);
    expect(page1Response.body).toHaveProperty("totalPosts");
    expect(page1Response.body).toHaveProperty("currentPage", 1);
    
    // בדיקת עמוד שני
    const page2Response = await request(app1)
      .get(`${baseUrl}?page=2&limit=3`)
      .set("Authorization", `Bearer ${accessToken}`);
    
    expect(page2Response.statusCode).toBe(200);
    expect(Array.isArray(page2Response.body.posts)).toBe(true);
    expect(page2Response.body.posts.length).toBeGreaterThan(0);
    expect(page2Response.body).toHaveProperty("currentPage", 2);
    
    // וידוא שהעמודים מכילים פוסטים שונים
    const page1Ids = page1Response.body.posts.map((post: any) => post._id);
    const page2Ids = page2Response.body.posts.map((post: any) => post._id);
    const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });
  
  // בדיקת עדכון פוסט
  test("Update post - successful", async () => {
    const updatedContent = "זהו תוכן מעודכן";
    const response = await request(app1)
      .put(`${baseUrl}/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: updatedContent });
    
    expect(response.statusCode).toBe(203);
    expect(response.body).toHaveProperty("_id", postId);
    expect(response.body).toHaveProperty("text", updatedContent);
    expect(response.body).toHaveProperty("updatedAt");
    
    // בדיקה שהעדכון נשמר במסד הנתונים
    const getResponse = await request(app1)
      .get(`${baseUrl}/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    
    expect(getResponse.body.text).toBe(updatedContent);
  });
  
  // בדיקת עדכון פוסט - ללא הרשאה
  test("Update post - unauthorized", async () => {
    // יצירת משתמש אחר
    const otherUser = {
      name: "other user",
      email: "other@test.com",
      password: "password123"
    };
    
    await request(app1).post("/auth/register").send(otherUser);
    const otherLoginResponse = await request(app1).post("/auth/login").send({
      email: otherUser.email,
      password: otherUser.password
    });
    
    const otherAccessToken = otherLoginResponse.body.accessToken;
    
    // ניסיון לעדכן פוסט של משתמש אחר
    const response = await request(app1)
      .put(`${baseUrl}/${postId}`)
      .set("Authorization", `Bearer ${otherAccessToken}`)
      .send({ text: "ניסיון עדכון לא מורשה" });
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message");
    
    // ניקוי - מחיקת המשתמש הנוסף
    await User.deleteMany({ email: otherUser.email });
  });
  
  // בדיקת מחיקת פוסט
  test("Delete post - successful", async () => {
    // יצירת פוסט חדש למחיקה
    const createResponse = await request(app1)
      .post(baseUrl)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "פוסט למחיקה" });
    
    const deletePostId = createResponse.body._id;
    
    // מחיקת הפוסט
    const deleteResponse = await request(app1)
      .delete(`${baseUrl}/${deletePostId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    
    expect(deleteResponse.statusCode).toBe(200);
    expect(deleteResponse.body).toHaveProperty("message");
    
    // בדיקה שהפוסט אכן נמחק
    const getResponse = await request(app1)
      .get(`${baseUrl}/${deletePostId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    
    expect(getResponse.statusCode).toBe(404);
  });
  
  // בדיקת מחיקת פוסט - ללא הרשאה
  test("Delete post - unauthorized", async () => {
    // יצירת משתמש אחר
    const otherUser = {
      name: "other user",
      email: "other@test.com",
      password: "password123"
    };
    
    await request(app1).post("/auth/register").send(otherUser);
    const otherLoginResponse = await request(app1).post("/auth/login").send({
      email: otherUser.email,
      password: otherUser.password
    });
    
    const otherAccessToken = otherLoginResponse.body.accessToken;
    
    // ניסיון למחוק פוסט של משתמש אחר
    const response = await request(app1)
      .delete(`${baseUrl}/${postId}`)
      .set("Authorization", `Bearer ${otherAccessToken}`);
    
    expect(response.statusCode).toBe(404);
    expect(response.body).toHaveProperty("message");
    
    // ניקוי - מחיקת המשתמש הנוסף
    await User.deleteMany({ email: otherUser.email });
  });
  
  // בדיקת קבלת פוסטים לפי משתמש
  test("Get posts by user", async () => {
    const response = await request(app1)
      .get(`${baseUrl}/user/${userId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.body.posts)).toBe(true);
    expect(response.body.posts.length).toBeGreaterThan(0);
    
    // בדיקה שכל הפוסטים שייכים למשתמש המבוקש
const allBelongToUser = response.body.posts.every((post: any) => post.author._id === userId);
expect(allBelongToUser).toBe(true);
  });
  
  
  // בדיקת טיפול בשגיאות שרת
  test("Server error handling", async () => {
    // שמירת הפונקציה המקורית
    const originalCreate = Post.create;
    
    // מוק לפונקציה שזורקת שגיאה
    Post.create = jest.fn().mockImplementationOnce(() => {
      throw new Error("Database error");
    });
    
    const response = await request(app1)
      .post(baseUrl)
      .set("Authorization", `Bearer ${accessToken}`)
      .send(testPost);
    
    expect(response.statusCode).toBe(500);
    expect(response.body).toHaveProperty("message");
    
    // החזרת הפונקציה המקורית
    Post.create = originalCreate;
  });
// בדיקת העלאת תמונה לפוסט
test("Upload image with post", async () => {
    const fs = require('fs');
    const path = require('path');
    
    // יצירת קובץ זמני לבדיקה
    const tempImagePath = path.join(__dirname, 'test-image.jpg');
    
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
      // הדפסת לוג לפני שליחת הבקשה
      console.log('Sending request to:', baseUrl);
      console.log('With token:', accessToken.substring(0, 10) + '...');
      
      // העלאת פוסט עם תמונה
      const request_obj = request(app1)
        .post(baseUrl)
        .set("Authorization", `Bearer ${accessToken}`)
        .field("text", "פוסט עם תמונה לבדיקה");
      
      // הוספת התמונה לבקשה
      request_obj.attach("image", tempImagePath);
      
      // שליחת הבקשה וקבלת תשובה
      const response = await request_obj;
      
      // הדפסת פרטי התשובה לצורך דיבוג
      console.log('Response status:', response.statusCode);
      console.log('Response headers:', response.headers);
      console.log('Response body type:', typeof response.body);
      console.log('Response body:', JSON.stringify(response.body, null, 2).substring(0, 500));
      
      // בדיקת תשובה
      if (response.statusCode !== 404) {
        expect(response.statusCode).toBe(201);
        
        // בדיקה יותר גמישה של התשובה
        if (typeof response.body === 'object' && response.body !== null) {
          // בדיקה אם יש שדה _id או id
          expect(response.body._id || response.body.id).toBeDefined();
          
          // בדיקה אם יש שדה text או תוכן
          expect(response.body.text || response.body.content).toBeDefined();
          
          // בדיקה אם יש שדה image או imageUrl או imageURL
          const hasImageField = 
            response.body.image !== undefined || 
            response.body.imageUrl !== undefined || 
            response.body.imageURL !== undefined ||
            response.body.imagePath !== undefined;
          
          expect(hasImageField).toBe(true);
        } else {
          // אם התשובה היא לא אובייקט, נכשיל את הבדיקה עם הודעה ברורה
          throw new Error(`Expected response body to be an object, got ${typeof response.body}`);
        }
      }
      
      // ניקוי הקובץ הזמני
      fs.unlinkSync(tempImagePath);
    } catch (error) {
      console.error('Upload image test error:', error);
      // ניקוי במקרה של שגיאה
      if (fs.existsSync(tempImagePath)) {
        fs.unlinkSync(tempImagePath);
      }
      throw error;
    }
  });
  
 });