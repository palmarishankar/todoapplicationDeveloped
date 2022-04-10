const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const date = require("date-fns");
const path = require("path");
const databasePath = path.join(__dirname, "toApplication.db");
const app = express();
let database = null;

const initializeDbAndServer = () => {
  try {
    database = open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DB error :${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

function hasTodoApplicationStatus(requestQuery) {
  return requestQuery.status !== undefined;
}

function hasTodoApplicationPriority(requestQuery) {
  return requestQuery.priority !== undefined;
}

function hasTodoApplicationPriorityAndStatus(requestQuery) {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
}

function hasTodoApplicationSearch_q(requestQuery) {
  return requestQuery.search_q !== undefined;
}

function hasTodoApplicationStatusAndCategory(requestQuery) {
  return (
    requestQuery.status !== undefined && requestQuery.category !== undefined
  );
}

function hasTodoApplicationCategory(requestQuery) {
  return requestQuery.category !== undefined;
}

function hasTodoApplicationCategoryAndPriority(requestQuery) {
  return (
    requestQuery.priority !== undefined && requestQuery.category !== undefined
  );
}

app.get("/todos/", async (request, response) => {
  const { status, priority, category, todo, search_q } = request.query;
  let getTodoQuery = "";
  let todoArray = null;
  switch (true) {
    case hasTodoApplicationStatus(request.query):
      getTodoQuery = `
            SELECT * from
            todo where status = "${status}";`;

      break;
    case hasTodoApplicationPriority(request.query):
      getTodoQuery = `
            SELECT * from
            todo where priority LIKE "%${priority}";`;

      break;
    case hasTodoApplicationPriorityAndStatus(request.query):
      getTodoQuery = `
            SELECT * from
            todo where status = "%${status}"
            AND priority LIKE "${priority}";`;

      break;

    case hasTodoApplicationSearch_q(request.query):
      getTodoQuery = `
            SELECT * from
            todo where todo LIKE "%${todo}%";`;

      break;

    case hasTodoApplicationStatusAndCategory(request.query):
      getTodoQuery = `
            SELECT * from
            todo where category LIKE "${category}"
            AND status = "${status}";`;

      break;

    case hasTodoApplicationCategory(request.query):
      getTodoQuery = `
            SELECT * from
            todo where category LIKE "${category}";`;

      break;

    case hasTodoApplicationCategoryAndPriority(request.query):
      getTodoQuery = `
            SELECT * from
            todo where category LIKE "${category}" 
            AND priority LIKE "${priority}";`;
  }
  todoArray = await database.all(getTodoQuery);
  response.send(todoArray);
});


app.get("/todos/:todoId/", (request, response) => {
  const { todoId } = request.params;

  const getSelectQuery = `
    SELECT * from todo where todoId = ${todoId};`;

  const todoArray = database.get(getSelectQuery);
  response.send(todoArray);
});

app.get("/agenda/", async (request, response) => {
  const { date } = request.params;
  const date = format(new Date(2021, 12, 12), "yyy-MM-dd");
  const selectDateQuery = `
    select * from todo where due_date=${date};`;
  const todoArray = database.get(selectDateQuery);
  response.send(todoArray);
});

app.post("/todos/",(request,response) => {
    const {id,todo,priority,status,category,dueDate} = request.body;
    const postQuery = `
    insert into 
    todo (id,todo,priority,status,category,dueDate)
    values (${id},'${todo}','${priority}','${status}','${category}','${dueDate}')

    `
    await database.run(postQuery);
    response.send("Todo successfully Added")

})

app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = "Status";
      break;
    case requestBody.priority !== undefined:
      updateColumn = "Priority";
      break;
    case requestBody.todo !== undefined:
      updateColumn = "Todo";
      break;
     case requestBody.category !== undefined:
      updateColumn = "category";
      break;
     case requestBody.dueDate !== undefined:
      updateColumn = "dueDate";
      break;
  }
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${todoId};`;
  const previousTodo = await database.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,

  } = request.body;

  const updateTodoQuery = `
    UPDATE
      todo
    SET
      todo='${todo}',
      priority='${priority}',
      status='${status}'
    WHERE
      id = ${todoId};`;

  await database.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await database.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
