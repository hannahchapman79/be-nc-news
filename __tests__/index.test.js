const db = require("../db/connection");
const seed = require("../db/seeds/seed");
const request = require("supertest");
const app = require("../app");
const data = require("../db/data/test-data/index");
const endpoints = require("../endpoints.json");

beforeEach(() => {
  return seed(data);
});

afterAll(() => {
  return db.end();
});

describe("/api/topics", () => {
  describe("GET", () => {
    test("responds with all topics", () => {
      return request(app)
        .get("/api/topics")
        .expect(200)
        .then((response) => {
          expect(response.body.topics.length).toBe(3);
          response.body.topics.forEach((topic) => {
            expect(typeof topic.description).toBe("string");
            expect(typeof topic.slug).toBe("string");
          });
        });
    });
    test("responds with 404 when endpoint doesn't exist", () => {
      return request(app)
        .get("/api/doesnotexist")
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("path not found");
        });
    });
  });
});

describe("GET /api", () => {
  test("responds with a json detailing all available endpoints", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        expect(body.endpoints).toEqual(endpoints);
      });
  });
});

describe("/api/articles", () => {
  describe("GET", () => {
    test("responds with all articles", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then((response) => {
          expect(response.body.articles.length).toBeGreaterThan(0);
          response.body.articles.forEach((article) => {
            expect(article).toHaveProperty("author");
            expect(article).toHaveProperty("title");
            expect(article).toHaveProperty("article_id");
            expect(article).toHaveProperty("topic");
            expect(article).toHaveProperty("created_at");
            expect(article).toHaveProperty("votes");
            expect(article).toHaveProperty("article_img_url");
            expect(article).toHaveProperty("comment_count");
            expect(typeof article.author).toBe("string");
            expect(typeof article.title).toBe("string");
            expect(typeof article.article_id).toBe("number");
            expect(typeof article.topic).toBe("string");
            expect(typeof article.created_at).toBe("string");
            expect(typeof article.votes).toBe("number");
            expect(typeof article.article_img_url).toBe("string");
            expect(article).not.toHaveProperty("body");
          });
        });
    });
    test("returns articles sorted by date in descending order", () => {
      return request(app)
        .get("/api/articles")
        .expect(200)
        .then((response) => {
          const articles = response.body.articles;
          expect(articles).toBeSortedBy("created_at", { descending: true });
        });
    });
    test("responds with 404 for a non-existent endpoint", () => {
      return request(app)
        .get("/api/nonexistent")
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("path not found");
        });
    });
    test("returns articles sorted by the given valid column", () => {
      return request(app)
        .get("/api/articles?sort_by=votes")
        .expect(200)
        .then((response) => {
          const articles = response.body.articles;
          expect(articles).toBeSortedBy("votes", { descending: true });
        });
    });
    test("returns articles sorted by the given valid column ascending", () => {
      return request(app)
        .get("/api/articles?sort_by=article_id&order=asc")
        .expect(200)
        .then((response) => {
          const articles = response.body.articles;
          expect(articles).toBeSortedBy("article_id", { ascending: true });
        });
    });
    test("responds with 400 error for an invalid sort-by column", () => {
      return request(app)
        .get("/api/articles?sort_by=article_code")
        .expect(400)
        .then((response) => {
          expect(response.body.message).toBe("bad request");
        });
    });
    test("responds with 400 error for an invalid order by clause", () => {
      return request(app)
        .get("/api/articles?sort_by=article_id&order=alphabetical")
        .expect(400)
        .then((response) => {
          expect(response.body.message).toBe("bad request");
        });
    });
    test("returns articles that match the topic query", () => {
      return request(app)
        .get("/api/articles?topic=cats")
        .expect(200)
        .then((response) => {
          const articles = response.body.articles;
          expect(articles.length).toBeGreaterThan(0);
          articles.forEach((article) => {
            expect(article.topic).toEqual("cats");
          });
        });
    });
    test("responds with 404 error for a topic that does not exist", () => {
      return request(app)
        .get("/api/articles?topic=orangecats")
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("topic does not exist");
        });
    });
    test("responds with articles not found if topic exists but doesn't have any articles", () => {
      return request(app)
        .get("/api/articles?topic=paper")
        .then((response) => {
          expect(404)
          expect(response.body.message).toBe("articles not found");
        });
    });
    test("responds with a default limit of 10 articles", () => {
      return request(app)
        .get("/api/articles")
        .then((response) => {
          expect(200)
          expect(response.body.articles.length).toEqual(10);
        });
    });
    test("responds with a limit of 5 articles", () => {
      return request(app)
        .get("/api/articles?limit=5")
        .then((response) => {
          expect(200)
          expect(response.body.articles.length).toEqual(5);
        });
    });
    test("responds with a limit of 10 articles when provided a query of limit and no specific value", () => {
      return request(app)
        .get("/api/articles?limit=")
        .then((response) => {
          expect(200)
          expect(response.body.articles.length).toEqual(10);
        });
    });
    test("responds with a limit of 10 articles on page 2", () => {
      return request(app)
        .get("/api/articles?sort_by=article_id&order=asc&limit=10&p=2")
        .then((response) => {
          expect(200)
          expect(response.body.articles[0].article_id).toEqual(11);
        });
    });
    test("responds with the total count of articles", () => {
      return request(app)
        .get("/api/articles?limit=10&p=1")
        .then((response) => {
          expect(200)
          expect(response.body.articles.length).toEqual(10);
          expect(response.body.totalCount).toEqual(10)
        });
    });
    test("responds with bad request when user inputs invalid limit", () => {
      return request(app)
        .get("/api/articles?&limit=abc")
        .then((response) => {
          expect(400)
          expect(response.body.message).toEqual("bad request");
        });
    });
    test("responds with bad request when user inputs invalid page", () => {
      return request(app)
        .get("/api/articles?p=-4")
        .then((response) => {
          expect(400)
          expect(response.body.message).toEqual("bad request");
        });
    });
    test("responds with bad request when user inputs invalid page", () => {
      return request(app)
        .get("/api/articles?p=abc")
        .then((response) => {
          expect(400)
          expect(response.body.message).toEqual("bad request");
        });
    });
    test("responds with not found when user inputs a page with no articles", () => {
      return request(app)
        .get("/api/articles?p=9")
        .then((response) => {
          expect(404)
          expect(response.body.message).toEqual("articles not found");
        });
    });
    test("responds with a default limit of 10 articles when a limit of 0 or below is specified", () => {
      return request(app)
        .get("/api/articles?limit=-5")
        .then((response) => {
          expect(200)
          expect(response.body.articles.length).toEqual(10);
        });
    });
  });
});

describe("/api/articles/:articles_id", () => {
  test("responds with an article of the corresponding id", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then((response) => {
        const article = response.body.article;
        expect(article).toHaveProperty("title");
        expect(article).toHaveProperty("author");
        expect(article).toHaveProperty("article_id");
        expect(article).toHaveProperty("topic");
        expect(article).toHaveProperty("created_at");
        expect(article).toHaveProperty("votes");
        expect(article).toHaveProperty("body");
        expect(article).toHaveProperty("article_img_url");
        expect(article.article_id).toBe(1);
        expect(article.title).toBe("Living in the shadow of a great man");
        expect(article.topic).toBe("mitch");
        expect(article.author).toBe("butter_bridge");
        expect(article.body).toBe("I find this existence challenging");
        expect(article.created_at).toBe("2020-07-09T13:11:00.000Z");
        expect(article.votes).toBe(100);
        expect(article.article_img_url).toBe(
          "https://images.pexels.com/photos/158651/news-newsletter-newspaper-information-158651.jpeg?w=700&h=700"
        );
      });
  });
  test("responds with an article of the corresponding id and displays its comment count", () => {
    return request(app)
      .get("/api/articles/1")
      .expect(200)
      .then((response) => {
        const article = response.body.article;
        expect(article).toHaveProperty("comment_count");
      });
  });
  test("responds with 404 error when id is valid but doesn't exist in the db", () => {
    return request(app)
      .get("/api/articles/29999")
      .expect(404)
      .then((response) => {
        expect(response.body.message).toEqual("article does not exist");
      });
  });
  test("responds with 400 error when the id is invalid", () => {
    return request(app)
      .get("/api/articles/not-an-article")
      .expect(400)
      .then((response) => {
        expect(response.body.message).toEqual("invalid id type");
      });
  });

  test("responds with an array of comments for the given article_id ", () => {
    return request(app)
      .get("/api/articles/6/comments")
      .expect(200)
      .then((response) => {
        expect(response.body.comments.length).toBeGreaterThan(0);
        response.body.comments.forEach((comment) => {
          expect(typeof comment.votes).toBe("number");
          expect(typeof comment.created_at).toBe("string");
          expect(typeof comment.author).toBe("string");
          expect(typeof comment.body).toBe("string");
          expect(typeof comment.article_id).toBe("number");
        });
      });
  });
  test("returns comments sorted by date in descending order", () => {
    return request(app)
      .get("/api/articles/1/comments")
      .expect(200)
      .then((response) => {
        const comments = response.body.comments;
        expect(comments).toBeSortedBy("created_at", { descending: true });
      });
  });
  test("responds with 400 error when the id is invalid", () => {
    return request(app)
      .get("/api/articles/not-an-article/comments")
      .expect(400)
      .then((response) => {
        expect(response.body.message).toEqual("invalid id type");
      });
  });
  test("responds with 404 error when id is valid but doesn't exist in the db", () => {
    return request(app)
      .get("/api/articles/29999/comments")
      .expect(404)
      .then((response) => {
        expect(response.body.message).toEqual("article does not exist");
      });
  });
  test("responds with an empty array if the article does not have any comments", () => {
    return request(app)
      .get("/api/articles/13/comments")
      .then((response) => {
        expect(response.body.comments).toEqual([]);
      });
  });
});

describe("/api/articles/:article_id/comments", () => {
  describe("POST", () => {
    test("adds comment for a given article and responds with the comment and 201 response code", () => {
      const newComment = {
        username: "butter_bridge",
        body: "I didn't find this article very interesting",
      };
      return request(app)
        .post("/api/articles/6/comments")
        .send(newComment)
        .expect(201)
        .then((response) => {
          const comment = response.body.comment;
          expect(comment.author).toBe("butter_bridge");
          expect(comment.body).toBe(
            "I didn't find this article very interesting"
          );
          expect(comment.comment_id).toEqual(expect.any(Number));
        });
    });
    test("responds with 404 error when id is present but doesn't exist in the db", () => {
      const newComment = {
        username: "butter_bridge",
        body: "I didn't find this article very interesting",
      };
      return request(app)
        .post("/api/articles/6000/comments")
        .send(newComment)
        .expect(404)
        .then((response) => {
          expect(response.body.message).toEqual("article does not exist");
        });
    });
    test("responds with 400 error when the comment is missing properties", () => {
      const newComment = {
        username: "butter_bridge",
      };
      return request(app)
        .post("/api/articles/6/comments")
        .send(newComment)
        .expect(400)
        .then((response) => {
          expect(response.body.message).toEqual("bad request");
        });
    });
    test("responds with 404 error when the user is not present in the db", () => {
      const newComment = {
        username: "iloveharrypotter",
        body: "I didn't find this article very interesting",
      };
      return request(app)
        .post("/api/articles/6/comments")
        .send(newComment)
        .expect(404)
        .then((response) => {
          expect(response.body.message).toEqual("user does not exist");
        });
    });
  });
});

describe("/api/articles/:article_id", () => {
  describe("PATCH", () => {
    test("updates a given article by incrementing or decrementing the votes", () => {
      const updateVote = {
        inc_votes: 1,
      };
      let previousVotes;
      return request(app)
        .get("/api/articles/1")
        .then((response) => {
          previousVotes = response.body.article.votes;

          return request(app)
            .patch("/api/articles/1")
            .send(updateVote)
            .expect(200);
        })
        .then((response) => {
          const article = response.body.updatedArticle;
          expect(typeof article.votes).toBe("number");
          expect(typeof article.title).toBe("string");
          expect(article.votes).toBe(previousVotes + updateVote.inc_votes);
        });
    });
    test("responds with 400 bad request when inc_votes is not provided", () => {
      const updateVote = {};
      return request(app)
        .patch("/api/articles/1")
        .send(updateVote)
        .expect(400)
        .then((response) => {
          expect(response.body.message).toEqual("bad request");
        });
    });
    test("responds with 404 not found when an article with the given id does not exist", () => {
      const updateVote = {
        inc_votes: 2,
      };
      return request(app)
        .patch("/api/articles/199")
        .send(updateVote)
        .expect(404)
        .then((response) => {
          expect(response.body.message).toEqual("article does not exist");
        });
    });
    test("responds with 400 invalid id type when the article id is invalid", () => {
      const updateVote = {
        inc_votes: 1,
      };
      return request(app)
        .patch("/api/articles/not-a-number")
        .send(updateVote)
        .expect(400)
        .then((response) => {
          expect(response.body.message).toEqual("invalid id type");
        });
    });
  });
});

describe("/api/comments/:comment_id", () => {
  describe("DELETE", () => {
    test("responds with 204 status and deletes the comment by comment id", () => {
      return request(app).delete("/api/comments/8").expect(204);
    });
    test("responds with 404 error when the given comment id doesn't exist in the db", () => {
      return request(app)
        .delete("/api/comments/800")
        .expect(404)
        .then((response) => {
          expect(response.body.message).toEqual("comment does not exist");
        });
    });
    test("responds with 400 bad request when the given an invalid comment id", () => {
      return request(app)
        .delete("/api/comments/not-a-number")
        .expect(400)
        .then((response) => {
          expect(response.body.message).toEqual("invalid id type");
        });
    });
  });
  describe("PATCH", () => {
    test("updates a given comment by incrementing or decrementing the votes", () => {
      const updateVote = {
        inc_votes: 1,
      };
      let previousVotes;
      return request(app)
        .get("/api/comments/2")
        .then((response) => {
          previousVotes = response.body.comment[0].votes;
          return request(app)
            .patch("/api/comments/2")
            .send(updateVote)
            .expect(200);
        })
        .then((response) => {
          const comment = response.body.updatedComment;
          expect(typeof comment.votes).toBe("number");
          expect(comment.votes).toBe(previousVotes + updateVote.inc_votes);
        });
    });
    test("responds with 400 bad request when inc_votes is not provided", () => {
      const updateVote = {};
      return request(app)
      .patch("/api/comments/1")
      .send(updateVote)
      .expect(400)
      .then((response) => {
        expect(response.body.message).toEqual("bad request");
      });
    });
    test("responds with 404 not found when an comment with the given id does not exist", () => {
      const updateVote = {
        inc_votes: 2,
      };
      return request(app)
      .patch("/api/comments/1999")
      .send(updateVote)
      .expect(404)
      .then((response) => {
        expect(response.body.message).toEqual("comment does not exist");
      });
    });
    test("responds with 400 invalid id type when the comment id is invalid", () => {
      const updateVote = {
        inc_votes: 1,
      };
      return request(app)
      .patch("/api/comments/not-a-number")
      .send(updateVote)
      .expect(400)
      .then((response) => {
        expect(response.body.message).toEqual("invalid id type");
      });
    });
  });
  });
  describe("GET", () => {
  test("responds with an comment of the corresponding id", () => {
    return request(app)
      .get("/api/comments/2")
      .expect(200)
      .then((response) => {
        const comment = response.body.comment[0];
        expect(comment).toHaveProperty("body");
        expect(comment).toHaveProperty("votes");
        expect(comment).toHaveProperty("author");
        expect(comment).toHaveProperty("comment_id");
        expect(comment).toHaveProperty("article_id");
        expect(comment).toHaveProperty("created_at");
        expect(comment.comment_id).toBe(2);
      });
  });
  test("responds with 404 when comment doesn't exist", () => {
    return request(app)
      .get("/api/comments/8888")
      .expect(404)
      .then((response) => {
        expect(response.body.message).toBe("comment does not exist");
      });
  });
  test("responds with 400 error when comment id is an invalid type", () => {
    return request(app)
      .get("/api/comments/i-love-cats")
      .expect(400)
      .then((response) => {
        expect(response.body.message).toBe("invalid id type");
      });
  });
});

describe("/api/users", () => {
  describe("GET", () => {
    test("responds with all users", () => {
      return request(app)
        .get("/api/users")
        .expect(200)
        .then((response) => {
          expect(response.body.users.length).toBeGreaterThan(0);
          response.body.users.forEach((user) => {
            expect(typeof user.name).toBe("string");
            expect(typeof user.username).toBe("string");
            expect(typeof user.avatar_url).toBe("string");
          });
        });
    });
    test("responds with 404 when endpoint doesn't exist", () => {
      return request(app)
        .get("/api/doesnotexist")
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("path not found");
        });
    });
  });
});

describe("/api/users/:username", () => {
  describe("GET", () => {
    test("responds with user by given username", () => {
      return request(app)
        .get("/api/users/lurker")
        .expect(200)
        .then((response) => {
          const user = response.body.user[0];
          expect(typeof user.name).toBe("string");
          expect(typeof user.username).toBe("string");
          expect(typeof user.avatar_url).toBe("string");
          expect(user.name).toBe("do_nothing");
          expect(user.username).toBe("lurker");
          expect(user.avatar_url).toBe(
            "https://www.golenbock.com/wp-content/uploads/2015/01/placeholder-user.png"
          );
        });
    });
    test("responds with 404 when user doesn't exist", () => {
      return request(app)
        .get("/api/users/ilovecats")
        .expect(404)
        .then((response) => {
          expect(response.body.message).toBe("user does not exist");
        });
    });
  });
});


