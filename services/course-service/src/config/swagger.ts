export const swaggerDocument = {
  openapi: "3.0.3",

  info: {
    title: "Course Service API",
    version: "1.0.0",
    description: "Course and lesson management API",
  },

  servers: [
    {
      url: `http://localhost:${process.env.PORT}/`,
    },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      Course: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
          title: {
            type: "string",
          },
          description: {
            type: "string",
          },
          price: {
            type: "number",
          },
          status: {
            type: "string",
            enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
          },
        },
      },

      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              message: {
                type: "string",
              },
            },
          },
        },
      },
    },
  },

  paths: {
    "/": {
      get: {
        summary: "Get courses",

        tags: ["Courses"],

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              default: 1,
            },
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              default: 20,
            },
          },
        ],

        responses: {
          200: {
            description: "Courses retrieved successfully",
          },

          400: {
            description: "Invalid request",
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/Error",
                },
              },
            },
          },
        },
      },

      post: {
        summary: "Create a course",

        tags: ["Courses"],

        security: [
          {
            bearerAuth: [],
          },
        ],

        requestBody: {
          required: true,

          content: {
            "application/json": {
              schema: {
                type: "object",

                required: ["title", "description", "price"],

                properties: {
                  title: {
                    type: "string",
                    minLength: 3,
                    maxLength: 200,
                  },

                  description: {
                    type: "string",
                    minLength: 10,
                  },

                  price: {
                    type: "number",
                    minimum: 0,
                  },

                  status: {
                    type: "string",
                    enum: ["DRAFT", "PUBLISHED", "ARCHIVED"],
                  },
                },
              },
            },
          },
        },

        responses: {
          201: {
            description: "Course created successfully",
          },

          400: {
            description: "Validation error",
          },

          401: {
            description: "Authentication required",
          },

          403: {
            description: "Insufficient permissions",
          },
        },
      },
    },

    "/{id}": {
      get: {
        summary: "Get course by ID",

        tags: ["Courses"],

        security: [
          {
            bearerAuth: [],
          },
        ],

        parameters: [
          {
            name: "id",
            in: "path",
            required: true,

            schema: {
              type: "string",
              format: "uuid",
            },
          },
        ],

        responses: {
          200: {
            description: "Course retrieved successfully",
          },

          404: {
            description: "Course not found",
          },
        },
      },
    },
  },
};
