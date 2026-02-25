
window.onload = function() {
  // Build a system
  var url = window.location.search.match(/url=([^&]+)/);
  if (url && url.length > 1) {
    url = decodeURIComponent(url[1]);
  } else {
    url = window.location.origin;
  }
  var options = {
  "swaggerDoc": {
    "openapi": "3.0.0",
    "info": {
      "title": "Swell API Documentation",
      "version": "1.0.0",
      "description": "Swell ?좏뵆由ъ??댁뀡??諛깆뿏??API 臾몄꽌?낅땲??"
    },
    "servers": [
      {
        "url": "http://localhost:8080",
        "description": "濡쒖뺄 媛쒕컻 ?쒕쾭"
      }
    ],
    "components": {
      "securitySchemes": {
        "bearerAuth": {
          "type": "http",
          "scheme": "bearer",
          "bearerFormat": "JWT"
        }
      }
    },
    "paths": {
      "/api/stt": {
        "post": {
          "summary": "?뚯꽦?몄떇(STT) ?뚯뒪?몄슜 Mock API",
          "tags": [
            "AI"
          ],
          "responses": {
            "200": {
              "description": "蹂?섎맂 ?띿뒪??諛섑솚 ?깃났"
            }
          }
        }
      },
      "/api/posts/{id}/comments": {
        "post": {
          "summary": "寃뚯떆湲???볤? ?묒꽦",
          "tags": [
            "Comments"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "content": {
                      "type": "string"
                    },
                    "userId": {
                      "type": "string"
                    },
                    "parentId": {
                      "type": "integer",
                      "description": "?듦???寃쎌슦 遺紐??볤???ID"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "?볤? ?앹꽦 ?깃났"
            }
          }
        }
      },
      "/api/comments/{id}/like": {
        "post": {
          "summary": "?볤? 醫뗭븘???좉?",
          "tags": [
            "Comments"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "userId": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "醫뗭븘???곹깭 蹂寃??깃났"
            }
          }
        }
      },
      "/api/posts/{id}/reaction": {
        "post": {
          "summary": "寃뚯떆湲 諛섏쓳(醫뗭븘???レ뼱?? ?④린湲?,
          "tags": [
            "Interactions"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "type": {
                      "type": "string",
                      "enum": [
                        "like",
                        "dislike"
                      ]
                    },
                    "userId": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "諛섏쓳 ????깃났"
            }
          }
        }
      },
      "/api/posts/{id}/vote": {
        "post": {
          "summary": "寃뚯떆湲 ?ы몴?섍린",
          "tags": [
            "Interactions"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "id",
              "required": true,
              "schema": {
                "type": "integer"
              }
            }
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "voteType": {
                      "type": "string",
                      "enum": [
                        "agree",
                        "disagree"
                      ]
                    },
                    "userId": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "?ы몴 ????깃났"
            }
          }
        }
      },
      "/api/notifications": {
        "get": {
          "summary": "???뚮┝ 紐⑸줉 議고쉶",
          "tags": [
            "Notifications"
          ],
          "parameters": [
            {
              "in": "query",
              "name": "userId",
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "?뚮┝ 紐⑸줉 諛섑솚 ?깃났"
            }
          }
        }
      },
      "/api/posts": {
        "get": {
          "summary": "寃뚯떆湲 紐⑸줉 議고쉶",
          "tags": [
            "Posts"
          ],
          "parameters": [
            {
              "in": "query",
              "name": "page",
              "schema": {
                "type": "integer",
                "default": 1
              }
            },
            {
              "in": "query",
              "name": "limit",
              "schema": {
                "type": "integer",
                "default": 20
              }
            },
            {
              "in": "query",
              "name": "filter",
              "schema": {
                "type": "string",
                "enum": [
                  "all",
                  "following"
                ],
                "default": "all"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "寃뚯떆湲 紐⑸줉 諛섑솚 ?깃났"
            }
          }
        },
        "post": {
          "summary": "??寃뚯떆湲 ?묒꽦",
          "tags": [
            "Posts"
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "content": {
                      "type": "string"
                    },
                    "hasVote": {
                      "type": "boolean"
                    },
                    "userId": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "201": {
              "description": "寃뚯떆湲 ?앹꽦 ?깃났"
            }
          }
        }
      },
      "/api/users/profile/{userId}": {
        "get": {
          "summary": "?ъ슜???꾨줈??議고쉶",
          "tags": [
            "Users"
          ],
          "parameters": [
            {
              "in": "path",
              "name": "userId",
              "required": true,
              "schema": {
                "type": "string"
              }
            }
          ],
          "responses": {
            "200": {
              "description": "?꾨줈???뺣낫 諛섑솚 ?깃났"
            }
          }
        }
      },
      "/api/users/follow": {
        "post": {
          "summary": "?ъ슜???붾줈???명뙏濡쒖슦",
          "tags": [
            "Users"
          ],
          "requestBody": {
            "required": true,
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "followerId": {
                      "type": "string"
                    },
                    "followingId": {
                      "type": "string"
                    }
                  }
                }
              }
            }
          },
          "responses": {
            "200": {
              "description": "?붾줈???곹깭 蹂寃??깃났"
            }
          }
        }
      }
    },
    "tags": []
  },
  "customOptions": {}
};
  url = options.swaggerUrl || url
  var urls = options.swaggerUrls
  var customOptions = options.customOptions
  var spec1 = options.swaggerDoc
  var swaggerOptions = {
    spec: spec1,
    url: url,
    urls: urls,
    dom_id: '#swagger-ui',
    deepLinking: true,
    presets: [
      SwaggerUIBundle.presets.apis,
      SwaggerUIStandalonePreset
    ],
    plugins: [
      SwaggerUIBundle.plugins.DownloadUrl
    ],
    layout: "StandaloneLayout"
  }
  for (var attrname in customOptions) {
    swaggerOptions[attrname] = customOptions[attrname];
  }
  var ui = SwaggerUIBundle(swaggerOptions)

  if (customOptions.oauth) {
    ui.initOAuth(customOptions.oauth)
  }

  if (customOptions.preauthorizeApiKey) {
    const key = customOptions.preauthorizeApiKey.authDefinitionKey;
    const value = customOptions.preauthorizeApiKey.apiKeyValue;
    if (!!key && !!value) {
      const pid = setInterval(() => {
        const authorized = ui.preauthorizeApiKey(key, value);
        if(!!authorized) clearInterval(pid);
      }, 500)

    }
  }

  if (customOptions.authAction) {
    ui.authActions.authorize(customOptions.authAction)
  }

  window.ui = ui
}

