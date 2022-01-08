import express from "express";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log("listening to", PORT);
});

const MONGO_URL = process.env.MONGO_URL;

async function createConnection() {
  try {
    const client = new MongoClient(MONGO_URL);
    await client.connect();
    console.log("mongo connected");
    return client;
  } catch (err) {
    console.log(err);
  }
}
createConnection();

app.post("/add_Student", async (req, res) => {
  const values = req.body;
  const client = await createConnection();
  await client.db("Guvi").collection("Students").insertOne(values);
  res.send({ message: "Successfully added" });
});

app.post("/add_Mentor", async (req, res) => {
  const values = req.body;
  const client = await createConnection();
  await client.db("Guvi").collection("Mentors").insertOne(values);
  res.send({ message: "Successfully added" });
});

app.get("/students/:mentor_name", async (req, res) => {
  const { mentor_name } = req.params;
  console.log(mentor_name);
  const client = await createConnection();
  try {
    const mentor_details = await client
      .db("Guvi")
      .collection("Mentors")
      .findOne({ Mentor_name: mentor_name });
    console.log("hi", mentor_details.Students);
    res.send({ Students: mentor_details.Students });
  } catch (err) {
    console.log(err);
  }
});
app.put("/assign_mentor/:student", async (req, res) => {
  const { student } = req.params;
  const { mentor } = req.body;
  console.log(student,mentor);
  if(await check(student)==null) res.send({"message":"student does not exist"});
  else{
      
  const client = await createConnection();
  var old_mentor = await client
    .db("Guvi")
    .collection("Students")
    .findOne({ name: student });
  old_mentor = old_mentor.mentor;
  if(old_mentor){
  var old_mentor_students = await client
    .db("Guvi")
    .collection("Mentors")
    .findOne({ Mentor_name: old_mentor });
  old_mentor_students = old_mentor_students.Students;
  var new_students = old_mentor_students.filter((e) => e !== student);
  await client
    .db("Guvi")
    .collection("Mentors")
    .updateOne(
      { Mentor_name: old_mentor },
      { $set: { Students: new_students } }
    );
    }
  await client
    .db("Guvi")
    .collection("Students")
    .updateOne({ name: student }, { $set: { mentor: mentor } });
  res.send({ message: "Successfully added" });
  var students = await client
    .db("Guvi")
    .collection("Mentors")
    .findOne({ Mentor_name: mentor });
  students = students.Students;
  students.push(student);
  await client
    .db("Guvi")
    .collection("Mentors")
    .updateOne({ Mentor_name: mentor }, { $set: { Students: students } });
}
});

app.put("/to_mentor/:mentor",async(req,res)=>{
    var {students}=req.body;
    const {mentor}=req.params;
    console.log(students);
    students=[...students];
    for (let i in students){
        console.log(students[i]);
       if( await check(students[i])==null)res.send({"message":`${students[i]} does not exist`});
       else if(await mentor_check(students[i])==null)res.send({"message":`${students[i]} already has a mentor` });
    }    
    const client=await createConnection();
    var old_students=await client.db("Guvi").collection("Mentors").findOne({"Mentor_name":mentor});
    old_students=old_students.Students;
    var student=[...old_students,...students];
    console.log(student);
    await client.db("Guvi").collection("Mentors").updateOne({"Mentor_name":mentor},{$set:{"Students":student}});
    res.send({"message":"updated"});
})

async function check(student){
    const client=await createConnection();
    const existing=await client.db("Guvi").collection("Students").findOne({"name":student});
    
    return existing;
}
async function mentor_check(student){
    const client=await createConnection();
    const existing=await client.db("Guvi").collection("Students").findOne({"name":student});
    if(existing.mentor) return null;
     else return true;
}