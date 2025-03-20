import mongoose from "mongoose";
import { Express } from "express";
import initApp from "../server";
import request from "supertest";
import { Comment } from '../models/commentModel';
import { Post } from '../models/postModel';
import { User } from '../models/userModel';

describe('בדיקות קונטרולר תגובות', () => {
  let app1: Express;
  let userId: string;
  let accessToken: string;
  let postId: string;
  let commentId: string;

  // לפני הבדיקות - התחברות והכנת נתונים
  beforeAll(async () => {
    console.log("התחלת בדיקות קונטרולר תגובות");
    const { app } = await initApp();
    app1 = app;
    
    // מחיקת נתוני בדיקה קודמים
    await Comment.deleteMany({});
    await Post.deleteMany({});
    await User.deleteMany({ email: "commenttest@example.com" });
    
    // יצירת משתמש בדיקה והתחברות
    const registerResponse = await request(app1)
      .post("/auth/register")
      .send({
        name: "בודק תגובות",
        email: "commenttest@example.com",
        password: "password123"
      });
    
    // התחברות
    const loginResponse = await request(app1)
      .post("/auth/login")
      .send({
        email: "commenttest@example.com",
        password: "password123"
      });
    
    accessToken = loginResponse.body.accessToken;
    userId = loginResponse.body.user.id;
    
    // יצירת פוסט לבדיקה
    const postResponse = await request(app1)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ text: "פוסט בדיקה לתגובות" });
    
    if (postResponse.status !== 201) {
      console.error("שגיאה ביצירת פוסט בדיקה:", postResponse.status, postResponse.body);
      throw new Error("לא הצלחנו ליצור פוסט בדיקה");
    }
    
    postId = postResponse.body._id;
  });
  
  // לאחר כל הבדיקות - ניקוי הנתונים ממסד הנתונים
  afterAll(async () => {
    console.log("סיום בדיקות קונטרולר תגובות");
    await Comment.deleteMany({});
    await Post.deleteMany({});
    await User.deleteMany({ email: "commenttest@example.com" });
    await mongoose.disconnect();
  });
  
  describe('יצירת תגובה חדשה', () => {
    test('יצירת תגובה חדשה בהצלחה', async () => {
      const response = await request(app1)
        .post(`/comments/createComment/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: 'תגובה לפוסט' });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('_id');
      expect(response.body).toHaveProperty('text', 'תגובה לפוסט');
      expect(response.body).toHaveProperty('author');
      
      // שמירת מזהה התגובה לשימוש בבדיקות הבאות
      commentId = response.body._id;
      
      // בדיקה שהתגובה נוספה לפוסט
      const updatedPost = await Post.findById(postId);
      expect(updatedPost).toBeDefined();
      expect(updatedPost?.comments).toBeDefined();
      expect(updatedPost?.comments.length).toBeGreaterThan(0);
      
      // בדיקה שהתגובה החדשה קיימת במערך התגובות
      const commentExists = updatedPost?.comments.some(
        (comment) => comment._id && comment._id.toString() === commentId
      );
      expect(commentExists).toBeTruthy();
    });
    
    test('חזרת שגיאה 404 כאשר הפוסט לא נמצא', async () => {
      const nonExistentPostId = new mongoose.Types.ObjectId().toString();
      const response = await request(app1)
        .post(`/comments/createComment/${nonExistentPostId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: 'תגובה לפוסט לא קיים' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Post not found');
    });
    
    test('חזרת שגיאה 401 כאשר אין הרשאה', async () => {
      const response = await request(app1)
        .post(`/comments/createComment/${postId}`)
        .send({ text: 'תגובה ללא הרשאה' });
      
      expect(response.status).toBe(401);
    });
  });
  
  describe('קבלת תגובות לפוסט', () => {
    test('קבלת תגובות לפוסט עם חלוקה לדפים', async () => {
      // יצירת מספר תגובות נוספות לצורך בדיקת דפדוף
      for (let i = 0; i < 5; i++) {
        await request(app1)
          .post(`/comments/createComment/${postId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ text: `תגובה מספר ${i+2}` });
      }
      
      const response = await request(app1)
        .get(`/comments/postComments/${postId}`)
        .query({ page: 1, limit: 3 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comments');
      expect(response.body.comments).toHaveLength(3);
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body).toHaveProperty('totalComments');
      expect(response.body.totalComments).toBeGreaterThanOrEqual(6);
    });
    
    test('קבלת עמוד שני של תגובות', async () => {
      const response = await request(app1)
        .get(`/comments/postComments/${postId}`)
        .query({ page: 2, limit: 3 });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('comments');
      expect(response.body.comments.length).toBeGreaterThan(0);
      expect(response.body).toHaveProperty('currentPage', 2);
    });
    
    test('שימוש בערכי ברירת מחדל כאשר לא מסופקים ערכי עמוד והגבלה', async () => {
      const response = await request(app1)
        .get(`/comments/postComments/${postId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('currentPage', 1);
      expect(response.body.comments.length).toBeGreaterThanOrEqual(1);
    });
  });
  
  describe('עדכון תגובה', () => {
    test('עדכון תגובה בהצלחה', async () => {
      const response = await request(app1)
        .put(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: 'תגובה מעודכנת' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('text', 'תגובה מעודכנת');
      expect(response.body).toHaveProperty('_id', commentId);
      
      // בדיקה שהתגובה אכן התעדכנה במסד הנתונים
      const updatedComment = await Comment.findById(commentId);
      expect(updatedComment?.text).toBe('תגובה מעודכנת');
    });
    
    test('חזרת שגיאה 404 כאשר התגובה לא נמצאה', async () => {
      const nonExistentCommentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app1)
        .put(`/comments/${nonExistentCommentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: 'עדכון תגובה לא קיימת' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Comment not found or unauthorized');
    });
    
    test('חזרת שגיאה 401 כאשר אין הרשאה', async () => {
      const response = await request(app1)
        .put(`/comments/${commentId}`)
        .send({ text: 'עדכון ללא הרשאה' });
      
      expect(response.status).toBe(401);
    });
    
    test('חזרת שגיאה 404 כאשר מנסים לעדכן תגובה של משתמש אחר', async () => {
      // יצירת משתמש נוסף
      await request(app1).post("/auth/register").send({
        name: "משתמש אחר",
        email: "other@example.com",
        password: "password123"
      });
      
      const otherLoginResponse = await request(app1).post("/auth/login").send({
        email: "other@example.com",
        password: "password123"
      });
      
      // קבלת הטוקן של המשתמש האחר
      const otherAccessToken = otherLoginResponse.body.accessToken;
      
      // ניסיון לעדכן תגובה של המשתמש הראשון
      const response = await request(app1)
        .put(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${otherAccessToken}`)
        .send({ text: 'עדכון על ידי משתמש אחר' });
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Comment not found or unauthorized');
      
      // ניקוי
      await User.deleteMany({ email: "other@example.com" });
    });
  });
  
  describe('מחיקת תגובה', () => {
    test('מחיקת תגובה בהצלחה', async () => {
      // יצירת תגובה חדשה למחיקה
      const newCommentResponse = await request(app1)
        .post(`/comments/createComment/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: 'תגובה למחיקה' });
      
      const deleteCommentId = newCommentResponse.body._id;
      
      const response = await request(app1)
        .delete(`/comments/${deleteCommentId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Comment deleted successfully');
      
      // בדיקה שהתגובה אכן נמחקה ממסד הנתונים
      const deletedComment = await Comment.findById(deleteCommentId);
      expect(deletedComment).toBeNull();
      
      // בדיקה שהתגובה הוסרה גם מהפוסט
      const updatedPost = await Post.findById(postId);
      
      if (updatedPost && Array.isArray(updatedPost.comments)) {
        const commentExists = updatedPost.comments.some(
          (comment) => comment._id && comment._id.toString() === deleteCommentId
        );
        expect(commentExists).toBeFalsy();
      }
    });
    
    test('חזרת שגיאה 404 כאשר התגובה לא נמצאה', async () => {
      const nonExistentCommentId = new mongoose.Types.ObjectId().toString();
      const response = await request(app1)
        .delete(`/comments/${nonExistentCommentId}`)
        .set('Authorization', `Bearer ${accessToken}`);
      
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Comment not found');
    });
    
    test('חזרת שגיאה 401 כאשר אין הרשאה', async () => {
      // יצירת תגובה חדשה לבדיקה
      const tempCommentResponse = await request(app1)
        .post(`/comments/createComment/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: 'תגובה לבדיקת מחיקה ללא הרשאה' });
      
      const tempCommentId = tempCommentResponse.body._id;
      
      const response = await request(app1)
        .delete(`/comments/${tempCommentId}`)
        .send();
      
      expect(response.status).toBe(401);
      
      // ניקוי - מחיקת התגובה הזמנית
      await request(app1)
        .delete(`/comments/${tempCommentId}`)
        .set('Authorization', `Bearer ${accessToken}`);
    });
  });

  describe('מקרי קצה ושגיאות', () => {
    test('חזרת שגיאה 500 בעת שגיאת שרת', async () => {
      // שמירת פונקציית המקור
      const originalCreate = Comment.create;
      
      // החלפת הפונקציה לפונקציית מוק שזורקת שגיאה
      // @ts-ignore - זריקת התעלמות מטיפוסים לצורך המוק
      Comment.create = jest.fn().mockImplementationOnce(() => {
        throw new Error("Database error");
      });
      
      const response = await request(app1)
        .post(`/comments/createComment/${postId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ text: 'תגובה שתגרום לשגיאה' });
      
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
      
      // החזרת הפונקציה המקורית
      // @ts-ignore - זריקת התעלמות מטיפוסים לצורך החזרת הפונקציה המקורית
      Comment.create = originalCreate;
    });
    
    test('טיפול נכון בקלט לא תקין', async () => {
      // שליחת אובייקט ריק לעדכון תגובה
      const response = await request(app1)
        .put(`/comments/${commentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({});
      
      // ציפייה לשגיאה, אם הקונטרולר בודק תוכן
      expect(response.status).not.toBe(200);
    });
  });
});