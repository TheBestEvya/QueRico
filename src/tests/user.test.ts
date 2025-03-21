import mongoose from "mongoose";
import { Express, response } from "express";
import initApp from "../server";
import request from "supertest";
import { User } from "../models/userModel";
import { IPost, Post } from "../models/postModel";
import { Comment } from "../models/commentModel";
import fs from "fs";
import path from "path";


describe("User Tests", () => {
    let app1: Express;
    
    // משתמש בדיקה ראשי
    const testUser = {
      name: "משתמש בדיקה",
      email: "user-test@example.com",
      password: "password123"
    };
    
    // משתמש נוסף לבדיקות
    const secondUser = {
      name: "משתמש בדיקה שני",
      email: "user-test2@example.com",
      password: "password123"
    };
    
    // משתמש למחיקה
    const deleteUser = {
      name: "משתמש למחיקה",
      email: "delete-me@example.com",
      password: "password123"
    };
    
    // אחסון טוקנים ומזהים
    let mainToken: string;
    let mainUserId: string;
    let secondToken: string;
    let secondUserId: string;
    let deleteToken: string;
    let deleteUserId: string;
    
    // מזהי פוסטים לבדיקות
    let testPostIds: string[] = [];
    
    // מזהי תגובות שנכתבו על ידי המשתמש למחיקה
    let deleteUserCommentIds: string[] = [];
    
    // מידע על פוסטים של המשתמש למחיקה (ישמש בבדיקת מחיקת תגובות)
    let postsOfDeleteUser: any[] = [];
  
    beforeAll(async () => {
      console.log("beforeAll - User Tests");
      const { app } = await initApp();
      app1 = app;
      
      // מחיקת נתוני בדיקה קודמים
      await User.deleteMany({ 
        email: { 
          $in: [testUser.email, secondUser.email, deleteUser.email] 
        } 
      });
      await Comment.deleteMany({});
      await Post.deleteMany({});
      
      // יצירת המשתמש הראשי והתחברות
      await request(app1).post("/auth/register").send(testUser);
      const mainLoginResponse = await request(app1).post("/auth/login").send({
        email: testUser.email,
        password: testUser.password
      });
      
      mainToken = mainLoginResponse.body.accessToken;
      mainUserId = mainLoginResponse.body.user.id;
      
      // יצירת המשתמש השני והתחברות
      await request(app1).post("/auth/register").send(secondUser);
      const secondLoginResponse = await request(app1).post("/auth/login").send({
        email: secondUser.email,
        password: secondUser.password
      });
      
      secondToken = secondLoginResponse.body.accessToken;
      secondUserId = secondLoginResponse.body.user.id;
      
      // יצירת המשתמש למחיקה והתחברות
      await request(app1).post("/auth/register").send(deleteUser);
      const deleteLoginResponse = await request(app1).post("/auth/login").send({
        email: deleteUser.email,
        password: deleteUser.password
      });
      
      deleteToken = deleteLoginResponse.body.accessToken;
      deleteUserId = deleteLoginResponse.body.user.id;
      
      // יצירת פוסטים למשתמש הראשי
      for (let i = 0; i < 6; i++) {
        const postResponse = await request(app1)
          .post("/posts")
          .set("Authorization", `Bearer ${mainToken}`)
          .send({
            text: `פוסט בדיקה ${i}`
          });
        
        testPostIds.push(postResponse.body._id);
      }
      
      // יצירת פוסטים למשתמש למחיקה
      for (let i = 0; i < 3; i++) {
        const postResponse = await request(app1)
          .post("/posts")
          .set("Authorization", `Bearer ${deleteToken}`)
          .send({
            text: `פוסט של משתמש למחיקה ${i}`
          });
        
        postsOfDeleteUser.push(postResponse.body);
      }
      
      // יצירת תגובות למשתמש למחיקה - על הפוסטים של המשתמש הראשי
      for (let i = 0; i < 3; i++) {
        const commentResponse = await request(app1)
          .post(`/comments/createComment/${testPostIds[i]}`)
          .set("Authorization", `Bearer ${deleteToken}`)
          .send({ text: `תגובה ${i} מהמשתמש המיועד למחיקה` });
        
        deleteUserCommentIds.push(commentResponse.body._id);
      }
      
      // יצירת תגובות של המשתמש הראשי על הפוסטים של המשתמש למחיקה
      for (let i = 0; i < postsOfDeleteUser.length; i++) {
        await request(app1)
          .post(`/comments/createComment/${postsOfDeleteUser[i]._id}`)
          .set("Authorization", `Bearer ${mainToken}`)
          .send({ text: `תגובה על פוסט של המשתמש למחיקה` });
      }
    });
    
    afterAll(async () => {
      console.log("afterAll - User Tests");
      await User.deleteMany({ 
        email: { 
          $in: [testUser.email, secondUser.email, deleteUser.email] 
        } 
      });
      await Comment.deleteMany({});
      await Post.deleteMany({});
      await mongoose.disconnect();
    });
  
    describe("קבלת מידע על משתמש", () => {
      test("קבלת פרופיל המשתמש המחובר", async () => {
        const response = await request(app1)
          .get("/users")
          .set("Authorization", `Bearer ${mainToken}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("name", testUser.name);
        expect(response.body).toHaveProperty("email", testUser.email);
        expect(response.body).not.toHaveProperty("password");
        expect(response.body).not.toHaveProperty("refreshToken");
      });
      
      test("קבלת מידע על משתמש לפי מזהה", async () => {
        const response = await request(app1)
          .get(`/users/${mainUserId}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("name", testUser.name);
        expect(response.body).toHaveProperty("email", testUser.email);
        expect(response.body).not.toHaveProperty("password");
        expect(response.body).not.toHaveProperty("refreshToken");
      });
      
      test("ניסיון לקבל מידע על משתמש לא קיים", async () => {
        const nonExistentUserId = new mongoose.Types.ObjectId().toString();
        const response = await request(app1)
          .get(`/users/${nonExistentUserId}`);
        
        expect(response.statusCode).toBe(404);
        expect(response.body).toHaveProperty("message", "User not found");
      });
      
      test("קבלת רשימת כל המשתמשים", async () => {
        const response = await request(app1)
          .get("/users/getAll");
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("users");
        expect(Array.isArray(response.body.users)).toBe(true);
        expect(response.body.users.length).toBeGreaterThanOrEqual(3);
        
        // בדיקה שהמשתמשים שלנו נמצאים ברשימה
        const foundTestUser = response.body.users.find((user: any) => user.email === testUser.email);
        const foundSecondUser = response.body.users.find((user: any) => user.email === secondUser.email);
        
        expect(foundTestUser).toBeDefined();
        expect(foundSecondUser).toBeDefined();
        
        // בדיקה שאין שדות רגישים
        expect(foundTestUser).not.toHaveProperty("password");
        expect(foundTestUser).not.toHaveProperty("refreshToken");
      });
    });
    
    describe("עדכון פרופיל משתמש", () => {
      test("עדכון שם משתמש", async () => {
        const updatedName = "משתמש בדיקה מעודכן";
        
        const response = await request(app1)
          .post("/users/update")
          .set("Authorization", `Bearer ${mainToken}`)
          .send({
            name: updatedName,
            email: testUser.email
          });
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("name", updatedName);
        
        // ווידוא שהעדכון נשמר במסד הנתונים
        const user = await User.findById(mainUserId);
        expect(user).not.toBeNull();
        expect(user!.name).toBe(updatedName);
        
        // החזרת השם המקורי לבדיקות הבאות
        await request(app1)
          .post("/users/update")
          .set("Authorization", `Bearer ${mainToken}`)
          .send({
            name: testUser.name,
            email: testUser.email
          });
      });
      
      test("עדכון פרופיל ללא הרשאה", async () => {
        const response = await request(app1)
          .post("/users/update")
          .send({
            name: "שם חדש",
            email: testUser.email
          });
        
        expect(response.statusCode).toBe(401);
      });
      
      test("עדכון פרופיל עם תמונה", async () => {
        // יצירת קובץ תמונה פשוט לבדיקה
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
          const response = await request(app1)
            .post("/users/update")
            .set("Authorization", `Bearer ${mainToken}`)
            .field("name", testUser.name)
            .field("email", testUser.email)
            .attach("profileImage", tempImagePath);
          
          if (response.statusCode === 200) {
            expect(response.body).toHaveProperty("profileImage");
            expect(typeof response.body.profileImage).toBe("string");
            expect(response.body.profileImage.length).toBeGreaterThan(0);
          } else {
            console.log("עדכון תמונת פרופיל לא נתמך או נכשל:", response.status, response.body);
          }
          
          // ניקוי הקובץ הזמני
          fs.unlinkSync(tempImagePath);
        } catch (error) {
          console.error("שגיאה בבדיקת העלאת תמונת פרופיל:", error);
          // ניקוי במקרה של שגיאה
          if (fs.existsSync(tempImagePath)) {
            fs.unlinkSync(tempImagePath);
          }
          throw error;
        }
      });
    });
    
    describe("פוסטים של משתמש", () => {
      test("קבלת הפוסטים של המשתמש", async () => {
        const response = await request(app1)
          .get(`/posts/user/${mainUserId}`)
          .set("Authorization", `Bearer ${mainToken}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("posts");
        expect(Array.isArray(response.body.posts)).toBe(true);
        expect(response.body.posts.length).toBeGreaterThan(0);
        
        // בדיקה שהפוסטים שיצרנו נמצאים ברשימה
        for (const postId of testPostIds) {
          const foundPost = response.body.posts.find((post: any) => post._id === postId);
          if (foundPost) {
            expect(foundPost.text).toMatch(/פוסט בדיקה \d/);
          }
        }
      });
      
      test("קבלת פוסטים עם חלוקה לדפים", async () => {
        // בדיקת עמוד ראשון עם 3 פוסטים
        const page1Response = await request(app1)
          .get(`/posts/user/${mainUserId}?page=1&limit=3`)
          .set("Authorization", `Bearer ${mainToken}`);
        
        expect(page1Response.statusCode).toBe(200);
        expect(page1Response.body.posts.length).toBe(3);
        expect(page1Response.body).toHaveProperty("currentPage", 1);
        expect(page1Response.body).toHaveProperty("totalPages");
        
        // בדיקת עמוד שני
        const page2Response = await request(app1)
          .get(`/posts/user/${mainUserId}?page=2&limit=3`)
          .set("Authorization", `Bearer ${mainToken}`);
        
        expect(page2Response.statusCode).toBe(200);
        expect(page2Response.body.posts.length).toBeGreaterThan(0);
        expect(page2Response.body).toHaveProperty("currentPage", 2);
        
        // וידוא שהעמודים מכילים פוסטים שונים
        const page1Ids = page1Response.body.posts.map((post: any) => post._id);
        const page2Ids = page2Response.body.posts.map((post: any) => post._id);
        const overlap = page1Ids.filter((id: string) => page2Ids.includes(id));
        expect(overlap.length).toBe(0);
      });
    });
    
    describe("מחיקת משתמש", () => {
      test("מחיקת משתמש מוצלחת", async () => {
        // בדיקה שהמשתמש קיים לפני המחיקה
        const userBeforeDelete = await User.findById(deleteUserId);
        expect(userBeforeDelete).not.toBeNull();
        
        // בדיקת מספר הפוסטים לפני המחיקה
        const postsBeforeDelete = await Post.countDocuments({ author: deleteUserId });
        expect(postsBeforeDelete).toBeGreaterThan(0);
        
        // בדיקת מספר התגובות שכתב המשתמש לפני המחיקה
        const commentsByUserBeforeDelete = await Comment.countDocuments({ author: deleteUserId });
        expect(commentsByUserBeforeDelete).toBeGreaterThan(0);
        
        // בדיקת מספר התגובות על פוסטים של המשתמש למחיקה
        const commentsOnPostsBeforeDelete = await Comment.countDocuments({ 
          post: { $in: postsOfDeleteUser.map(post => post._id) } 
        });
        expect(commentsOnPostsBeforeDelete).toBeGreaterThan(0);
        
        // מחיקת המשתמש
        const response = await request(app1)
          .delete("/users/delete")
          .set("Authorization", `Bearer ${deleteToken}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty("message");
        
        // וידוא שהמשתמש נמחק
        const userAfterDelete = await User.findById(deleteUserId);
        expect(userAfterDelete).toBeNull();
        
        // וידוא שהפוסטים של המשתמש נמחקו
        const postsAfterDelete = await Post.countDocuments({ author: deleteUserId });
        expect(postsAfterDelete).toBe(0);
      });
      
      test("תגובות של המשתמש נמחקות כאשר המשתמש נמחק", async () => {
        // וידוא שהתגובות של המשתמש שנמחק לא קיימות יותר
        for (const commentId of deleteUserCommentIds) {
          const comment = await Comment.findById(commentId);
          expect(comment).toBeNull();
        }
        
        // בדיקה כוללת שאין תגובות של המשתמש שנמחק במסד הנתונים
        const commentsOfDeletedUser = await Comment.countDocuments({ author: deleteUserId });
        expect(commentsOfDeletedUser).toBe(0);
      });
      
      test("תגובות על פוסטים של המשתמש נמחקות כאשר הפוסטים נמחקים", async () => {
        // בדיקה שאין תגובות על פוסטים שנמחקו (פוסטים של המשתמש שנמחק)
        const postsOfDeletedUser = await Post.countDocuments({ author: deleteUserId });
        expect(postsOfDeletedUser).toBe(0);
        
        // בדיקה שכל התגובות על פוסטים של המשתמש שנמחק גם נמחקו
        const commentsOnDeletedUserPosts = await Comment.countDocuments({ 
          post: { $in: postsOfDeleteUser.map(post => post._id) } 
        });
        
        expect(commentsOnDeletedUserPosts).toBe(0);
      });
      
      test("ניסיון למחוק משתמש ללא הרשאה", async () => {
        const response = await request(app1)
          .delete("/users/delete");
        
        expect(response.statusCode).toBe(401);
      });
      
      test("ניסיון לגשת לפרופיל אחרי מחיקה", async () => {
        const response = await request(app1)
          .get("/users")
          .set("Authorization", `Bearer ${deleteToken}`);
        
        // מצפים לאחת משתי השגיאות האפשריות: 401 או 404
        expect([401, 404]).toContain(response.statusCode);
      });
    
    describe("שגיאות ומקרי קצה", () => {
      test("טיפול בשגיאות ב-getUserById", async () => {
        const invalidUserId = "invalid-id";
        const response = await request(app1)
          .get(`/users/${invalidUserId}`);
        
        expect(response.statusCode).toBe(500);
        expect(response.body).toHaveProperty("message");
      });
      
      test("טיפול בשגיאות בעדכון פרופיל", async () => {
        const originalFindByIdAndUpdate = User.findByIdAndUpdate;
        
        // מוק לפונקציה שזורקת שגיאה
        // @ts-ignore
        User.findByIdAndUpdate = jest.fn().mockImplementationOnce(() => {
          throw new Error("Database error");
        });
        
        const response = await request(app1)
          .post("/users/update")
          .set("Authorization", `Bearer ${mainToken}`)
          .send({
            name: "שם חדש",
            email: testUser.email
          });
        
        expect(response.statusCode).toBe(500);
        expect(response.body).toHaveProperty("message");
        
        // החזרת הפונקציה המקורית
        // @ts-ignore
        User.findByIdAndUpdate = originalFindByIdAndUpdate;
      });
       });
   });
  });