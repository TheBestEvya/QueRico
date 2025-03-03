import { Post } from "../models/postModel";

//clears DB from content before testing
beforeAll(async () => {
    console.log("beforeAll");
    await Post.deleteMany();
    } );


test("",()=>{

})