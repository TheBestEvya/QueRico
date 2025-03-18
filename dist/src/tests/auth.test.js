"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("../server"));
const supertest_1 = __importDefault(require("supertest"));
const mongoose_1 = __importDefault(require("mongoose"));
const userModel_1 = require("../models/userModel");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var app;
beforeAll(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("beforeAll");
    app = yield (0, server_1.default)();
    yield userModel_1.User.deleteMany();
    //   await postModel.deleteMany();
}));
afterAll(() => __awaiter(void 0, void 0, void 0, function* () {
    console.log("afterAll");
    yield mongoose_1.default.disconnect();
    // done();
}));
const baseUrl = "/auth";
const testUser = {
    name: "test",
    email: "test@user.com",
    password: "testpassword",
};
describe("Auth Tests", () => {
    test("Auth test register", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/register").send(testUser);
        expect(response.statusCode).toBe(201);
    }));
    // בדיקת רישום מוצלח עם בדיקת מבנה התשובה
    test("Auth test register - successful response structure", () => __awaiter(void 0, void 0, void 0, function* () {
        const newUser = {
            name: "Test Response",
            email: "response@test.com",
            password: "responsepassword"
        };
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/register").send(newUser);
        expect(response.statusCode).toBe(201);
        expect(response.body).toHaveProperty('user');
        expect(response.body).toHaveProperty('accessToken');
        expect(response.body).toHaveProperty('refreshToken');
        expect(response.body.user.name).toBe(newUser.name);
        expect(response.body.user.email).toBe(newUser.email);
    }));
    // בדיקת רישום עם אימייל שכבר קיים
    test("Auth test register - duplicate email", () => __awaiter(void 0, void 0, void 0, function* () {
        // ניסיון נוסף לרשום את אותו משתמש
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/register").send(testUser);
        expect(response.statusCode).toBe(400);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('email already exists');
    }));
    // בדיקת רישום עם אימייל לא תקין
    test("Auth test register - invalid email", () => __awaiter(void 0, void 0, void 0, function* () {
        const invalidEmailUser = {
            name: "Invalid Email",
            email: "notanemail",
            password: "password123"
        };
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/register").send(invalidEmailUser);
        expect(response.statusCode).not.toBe(201);
    }));
    // בדיקת רישום עם שדות חסרים
    test("Auth test register - missing fields", () => __awaiter(void 0, void 0, void 0, function* () {
        const missingFieldsUser = {
            email: "missing@test.com"
            // חסר שם וסיסמה
        };
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/register").send(missingFieldsUser);
        expect(response.statusCode).not.toBe(201);
    }));
    test("Auth test login", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({ email: testUser.email, password: testUser.password });
        expect(response.statusCode).toBe(200);
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.user).toBeDefined();
    }));
    test("Auth test login - fail", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({ email: "email", password: testUser.password });
        expect(response.statusCode).toBe(401);
    }));
    // בדיקת התחברות עם סיסמה שגויה
    test("Auth test login - wrong password", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
            email: testUser.email,
            password: "wrongpassword123"
        });
        expect(response.statusCode).toBe(401);
        expect(response.body.message).toBe('Invalid credentials');
    }));
    // בדיקת מבנה התשובה המלא בהתחברות מוצלחת
    test("Auth test login - response structure", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
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
    }));
    // בדיקה שהרפרש טוקן מתעדכן במסד הנתונים
    test("Auth test login - refresh token updated", () => __awaiter(void 0, void 0, void 0, function* () {
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
            email: testUser.email,
            password: testUser.password
        });
        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('refreshToken');
        // בדיקה שהרפרש טוקן נשמר במסד הנתונים
        const userId = response.body.user.id;
        const user = yield userModel_1.User.findById(userId);
        if (user) {
            expect(user).not.toBeNull();
            expect(user.refreshToken).toBe(response.body.refreshToken);
        }
    }));
    // בדיקת התחברות ללא שדות נדרשים
    test("Auth test login - missing fields", () => __awaiter(void 0, void 0, void 0, function* () {
        // חסר אימייל
        const responseNoEmail = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
            password: testUser.password
        });
        expect(responseNoEmail.statusCode).not.toBe(200);
        // חסרה סיסמה
        const responseNoPassword = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
            email: testUser.email
        });
        expect(responseNoPassword.statusCode).not.toBe(200);
    }));
    // בדיקת טיפול בשגיאות שרת
    test("Auth test login - server error handling", () => __awaiter(void 0, void 0, void 0, function* () {
        // שמירת הפונקציה המקורית
        const originalFindOne = userModel_1.User.findOne;
        // מוק לפונקציה שזורקת שגיאה
        userModel_1.User.findOne = jest.fn().mockImplementationOnce(() => {
            throw new Error('Database error');
        });
        const response = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
            email: testUser.email,
            password: testUser.password
        });
        // בדיקה שמוחזר קוד שגיאה 500
        expect(response.statusCode).toBe(500);
        expect(response.body).toHaveProperty('message');
        expect(response.body.message).toBe('Error logging in');
        // החזרת הפונקציה המקורית
        userModel_1.User.findOne = originalFindOne;
    }));
    describe("Auth Tests - Refresh Token", () => {
        let refreshToken;
        const testUser2 = {
            name: "test2",
            email: "test2@user.com",
            password: "testpassword",
        };
        test("Refresh token - successful refresh", () => __awaiter(void 0, void 0, void 0, function* () {
            const registerResponse = yield (0, supertest_1.default)(app).post(baseUrl + "/register").send(testUser2);
            expect(registerResponse.statusCode).toBe(201);
            // נתחבר כדי לקבל רענון טוקן
            const loginResponse = yield (0, supertest_1.default)(app).post(baseUrl + "/login").send({
                email: testUser2.email,
                password: testUser2.password
            });
            expect(loginResponse.statusCode).toBe(200);
            refreshToken = loginResponse.body.refreshToken;
            // בדיקת חידוש תקין של טוקן
            const response = yield (0, supertest_1.default)(app).post(baseUrl + '/refresh-token').send({ refreshToken });
            console.log(response.body);
            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty("accessToken");
            expect(response.body).toHaveProperty("refreshToken");
            expect(response.body.refreshToken).not.toBe(refreshToken); // מוודא שהטוקן השתנה
        }));
        // בדיקת חידוש טוקן ללא שליחתו
        test("Refresh token - missing token", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post(baseUrl + "/refresh-token").send({});
            expect(response.statusCode).toBe(401);
            expect(response.body.message).toBe("Refresh token required");
        }));
        // בדיקת חידוש עם טוקן לא תקף
        test("Refresh token - invalid token", () => __awaiter(void 0, void 0, void 0, function* () {
            const response = yield (0, supertest_1.default)(app).post(baseUrl + "/refresh-token").send({ refreshToken: "invalid_token" });
            expect(response.statusCode).toBe(403);
            expect(response.body.message).toBe("Invalid refresh token");
        }));
        // בדיקה האם השרת מטפל בשגיאות פנימיות
        test("Refresh token - server error handling", () => __awaiter(void 0, void 0, void 0, function* () {
            const originalFindOne = userModel_1.User.findOne;
            // יוצרים מצב שהפונקציה תזרוק שגיאה
            userModel_1.User.findOne = jest.fn().mockImplementationOnce(() => {
                throw new Error("Database error");
            });
            const response = yield (0, supertest_1.default)(app).post(baseUrl + "/refresh-token").send({ refreshToken });
            expect(response.statusCode).toBe(500);
            expect(response.body).toHaveProperty("message");
            expect(response.body.message).toBe("Error refreshing token");
            // מחזירים את הפונקציה המקורית
            userModel_1.User.findOne = originalFindOne;
        }));
        // בדיקה שהטוקן נמחק אם הוא לא תקף
        test("Refresh token - expired token", () => __awaiter(void 0, void 0, void 0, function* () {
            // ניצור טוקן פג תוקף
            const expiredToken = jsonwebtoken_1.default.sign({ id: "fakeUserId" }, process.env.JWT_REFRESH_SECRET || "your-refresh-secret-key", { expiresIn: "-10s" });
            const response = yield (0, supertest_1.default)(app).post(baseUrl + "/refresh-token").send({ refreshToken: expiredToken });
            expect(response.statusCode).toBe(403);
            expect(response.body.message).toBe("Invalid refresh token");
            // נבדוק שהטוקן הוסר מהמשתמש (אם קיים במערכת)
            const user = yield userModel_1.User.findOne({ refreshToken: expiredToken });
            expect(user).toBeNull();
        }));
    });
});
//# sourceMappingURL=auth.test.js.map