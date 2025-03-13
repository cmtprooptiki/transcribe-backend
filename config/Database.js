import { Sequelize } from "sequelize";


const db=new Sequelize('transcribe_db','root','',{
    host:"localhost",
    dialect:"mysql",
    port:3306
});


export default db;