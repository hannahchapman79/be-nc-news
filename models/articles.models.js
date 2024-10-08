const db = require("../db/connection");
const checkArticleExists = require("../check-article-exists");
const checkUserExists = require("../check-user-exists");
const checkTopicExists = require("../check-topic-exists")

exports.selectArticleById = (article_id) => {
  let queryString = `
  SELECT
  articles.article_id, 
  articles.title, 
  articles.topic, 
  articles.author, 
  articles.body,
  articles.created_at, 
  articles.votes, 
  articles.article_img_url,
  COUNT(comments.comment_id) AS comment_count
  FROM 
  articles
  LEFT JOIN 
  comments
  ON 
  articles.article_id = comments.article_id
  WHERE
  articles.article_id = $1
  GROUP BY articles.article_id;
  `
  return db
    .query(queryString, [article_id])
    .then((result) => {
      if (result.rows.length === 0) {
        return Promise.reject({
          status: 404,
          message: `article does not exist`,
        });
      } else {
        return result.rows[0];
      }
    });
};

exports.selectArticles = (sort_by = "created_at", order = "desc", topic, limit = 10, p = 1) => {
  const validSortBys = [
    "article_id",
    "title",
    "topic",
    "author",
    "created_at",
    "votes",
    "article_img_url",
    "comment_count",
    "limit",
    "p"
  ];
  const validOrders = ["desc", "asc", "DESC", "ASC"];
  const offset = (p - 1) * limit;

  if (!limit || limit <= 0) {
    limit = 10;
  }

  if (p < 0) {
    return Promise.reject({ status: 400, message: "bad request" });
  }

  if (!validOrders.includes(order)) {
    return Promise.reject({ status: 400, message: "bad request" });
  }

  if (!validSortBys.includes(sort_by)) {
    return Promise.reject({ status: 400, message: "bad request" });
  }

  if (isNaN(p) || isNaN(limit)) {
    return Promise.reject({
      status: 400,
      message: "bad request",
    });
  }

  else {
    let sqlString = `
    WITH article_counts AS (
      SELECT
        articles.article_id,
        articles.title,
        articles.topic,
        articles.author,
        articles.created_at,
        articles.votes,
        articles.article_img_url,
        COUNT(comments.comment_id) AS comment_count
      FROM 
        articles
      LEFT JOIN 
        comments ON articles.article_id = comments.article_id
      GROUP BY 
        articles.article_id
    )
    SELECT * FROM article_counts`

    if (topic) {
      sqlString += ` WHERE topic = '${topic}'`;
    }

    sqlString += ` ORDER BY ${sort_by} ${order}`;

    sqlString += ` limit ${limit} offset ${offset};`;

    return db.query(sqlString).then((result) => {
      if (result.rows.length === 0) {
        return checkTopicExists(topic).then((exists) => {
          if (topic && !exists) {
            return Promise.reject({
              status: 404,
              message: `topic does not exist`,
            });
          }
          else {
            return Promise.reject({
              status: 404,
              message: `articles not found`,
            });
          }
        });
      }
      return result.rows;
    });
  }
};

exports.selectArticleComments = (article_id) => {
  const query = `
    SELECT 
        *
    FROM
        comments
    WHERE
        article_id = $1
    ORDER BY
        created_at DESC;
    `;
  return db.query(query, [article_id]).then((result) => {
    if (result.rows.length === 0) {
      return checkArticleExists(article_id).then((exists) => {
        if (!exists) {
          return Promise.reject({
            status: 404,
            message: `article does not exist`,
          });
        }
        return result.rows;
      });
    }
    return result.rows;
  });
};

exports.insertComment = (article_id, newComment) => {
  if (!newComment.username || !newComment.body) {
    return Promise.reject({
      status: 400,
      message: "bad request",
    });
  }
  return checkArticleExists(article_id).then((exists) => {
    if (!exists) {
      return Promise.reject({
        status: 404,
        message: "article does not exist",
      });
    }
    return checkUserExists(newComment.username).then((userExists) => {
      if (!userExists) {
        return Promise.reject({
          status: 404,
          message: "user does not exist",
        });
      } else {
        return db
          .query(
            "INSERT INTO comments (author, body, article_id, votes) VALUES ($1, $2, $3, $4) RETURNING *",
            [newComment.username, newComment.body, article_id, 0]
          )
          .then((result) => {
            return result.rows[0];
          });
      }
    });
  });
};

exports.incrementVote = (article_id, updateVoteBy) => {
  const num = updateVoteBy.inc_votes;
  if (num === undefined || typeof num !== "number") {
    return Promise.reject({
      status: 400,
      message: "bad request",
    });
  }
  return checkArticleExists(article_id).then((exists) => {
    if (!exists) {
      return Promise.reject({
        status: 404,
        message: "article does not exist",
      });
    }
    const query = `
        UPDATE articles 
        SET votes = votes + $1 
        WHERE article_id = $2 
        RETURNING *;
      `;
    return db.query(query, [num, article_id]).then((result) => {
      return result.rows[0];
    });
  });
};
