import initApp from "../server";
import request from "supertest";
import mongoose from "mongoose";
import { Express } from "express";
import { User as userModel,IUser } from "../models/userModel";

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



});