const express = require('express');
const { checkBody, checkParams } = require('./validation/validator');
const { idScheme, articleScheme } = require('./validation/scheme');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const pathJSON = path.join(__dirname, "articles.json");

const app = express();

// const articles = [];
let uniqueID = 1;

app.use(express.json());

app.get('/', (req, res) => {
   fs.readFile(pathJSON, "utf-8", (error, data) => {
      let html = '<h1>Articles list</h1>';
      if (error) return res.status(404).send(html += "<h2>article: null</h2>");
      let articles = JSON.parse(data, "utf-8");
      const article = handlebars.compile(
         "{{#each articles}}" +
         "<p>Статья {{this.id}}</p>" +
         "<h2>{{this.title}}</h2>" +
         "<p>{{this.content}}</p>" +
         "{{/each}}"
      );
      html += article({ articles });
      res.send(html);
   });
});

/**
 * Получить все статьи
 */
app.get('/articles', (req, res) => {
   fs.readFile(pathJSON, "utf-8", (error, data) => {
      if (error) return res.status(404).send({ article: null });
      let articles = JSON.parse(data, "utf-8");
      res.send({ articles })
   });
});

/**
 * Получить статью по id
 */
app.get('/articles/:id', checkParams(idScheme), (req, res) => {
   fs.readFile(pathJSON, "utf-8", (error, data) => {
      if (error) return res.status(404).send({ article: null });
      let articles = JSON.parse(data, "utf-8");
      const article = articles.find((article) => article.id === Number(req.params.id));
      if (article) {
         res.send({ article });
      } else {
         res.status(404);
         res.send({ article: null });
      }
   });
});

/**
 * Запись данных в файл
 * @param {Новые данные} req 
 * @param {Записанные данные} data 
 * @param {Порядковый номер записи} uid 
 */
const addData = (req, data, uid) => {
   data.push({
      id: uid,
      ...req.body
   });
   fs.writeFile(pathJSON, JSON.stringify(data, null, 2), (error) => {
      if (error) return res.status(404).send({ article: null });
   });
}

/**
 * Создать статью
 */
app.post('/articles', checkBody(articleScheme), (req, res) => {
   let articles = [];
   if (fs.existsSync(pathJSON)) {
      fs.readFile(pathJSON, "utf-8", (error, data) => {
         if (error) return res.status(404).send({ article: null });
         articles = JSON.parse(data, "utf-8");
         uniqueID = articles[articles.length - 1].id + 1;
         addData(req, articles, uniqueID);
         res.send({ id: uniqueID });
      });
   } else {
      addData(req, articles, uniqueID);
      res.send({ id: uniqueID });
   }
});

/**
 * Изменить статью по id
 */
app.put('/articles/:id', checkParams(idScheme), checkBody(articleScheme), (req, res) => {
   fs.readFile(pathJSON, "utf-8", (error, data) => {
      if (error) return res.status(404).send({ article: null });
      let articles = JSON.parse(data, "utf-8");
      const article = articles.find((article) => article.id === Number(req.params.id));
      if (article) {
         article.title = req.body.title;
         article.content = req.body.content;
         fs.writeFile(pathJSON, JSON.stringify(articles, null, 2), (error) => {
            if (error) return res.status(404).send({ article: null });
         });
         res.send({ article });
      } else {
         res.status(404);
         res.send({ article: null });
      }
   });
});

/**
 * Удалить статью по id
 */
app.delete('/articles/:id', checkParams(idScheme), (req, res) => {
   fs.readFile(pathJSON, "utf-8", (error, data) => {
      if (error) return res.status(404).send({ article: null });
      let articles = JSON.parse(data, "utf-8");
      const article = articles.find((article) => article.id === Number(req.params.id));
      if (article) {
         const articleIndex = articles.indexOf(article);
         articles.splice(articleIndex, 1);
         fs.writeFile(pathJSON, JSON.stringify(articles, null, 2), (error) => {
            if (error) return res.status(404).send({ article: null });
         });
         res.send({ article });
      } else {
         res.status(404);
         res.send({ article: null });
      }
   });
});

/**
 * Обработка несуществующих роутов
 */
app.use((req, res) => {
   res.status(404).send({
      messge: 'URL not found!'
   })
});

app.listen(3000);