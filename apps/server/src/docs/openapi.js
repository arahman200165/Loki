export const createOpenApiDocument = ({ apiPrefix, apiKeyHeader }) => ({
  openapi: '3.0.3',
  info: {
    title: 'Loki API',
    version: '1.0.0',
    description:
      'Interactive API docs for Sprint 1 and Sprint 2 QA. Register or log in with an API key, then use the bearer token on protected endpoints.'
  },
  servers: [
    {
      url: apiPrefix
    }
  ],
  tags: [
    { name: 'Health', description: 'Public service and database health checks.' },
    { name: 'Auth', description: 'Account registration, login, logout, and session inspection.' },
    {
      name: 'Contact',
      description:
        'Contact-request lifecycle (send, respond, list pending) and blocking. The send endpoint ' +
        'always returns a uniform response regardless of whether the target Public-ID exists.'
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: apiKeyHeader,
        description: 'Required on all auth endpoints.'
      },
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Opaque session token'
      }
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        required: ['status', 'uptime', 'timestamp'],
        properties: {
          status: {
            type: 'string',
            enum: ['ok', 'degraded']
          },
          uptime: {
            type: 'number',
            example: 12.348
          },
          timestamp: {
            type: 'string',
            format: 'date-time'
          },
          database: {
            type: 'object',
            additionalProperties: true,
            example: { status: 'ok' }
          }
        }
      },
      AuthRequest: {
        type: 'object',
        required: ['username', 'password'],
        properties: {
          username: {
            type: 'string',
            example: 'testuser1'
          },
          password: {
            type: 'string',
            example: 'securepass1234'
          }
        }
      },
      AuthSuccessResponse: {
        type: 'object',
        required: ['token', 'user'],
        properties: {
          token: {
            type: 'string',
            example: '0d558fb842a9d8b7af1e3dd3b386376f0dbf26c13a6b9f80f21918c8d62f5f0f'
          },
          user: {
            $ref: '#/components/schemas/AuthUser'
          }
        }
      },
      AuthUser: {
        type: 'object',
        required: ['id', 'username'],
        properties: {
          id: {
            type: 'string',
            format: 'uuid'
          },
          username: {
            type: 'string',
            example: 'testuser1'
          }
        }
      },
      SessionContextResponse: {
        type: 'object',
        required: ['session'],
        properties: {
          session: {
            type: 'object',
            required: ['token', 'accountId', 'deviceId', 'username'],
            properties: {
              token: {
                type: 'string'
              },
              accountId: {
                type: 'string',
                format: 'uuid'
              },
              deviceId: {
                type: 'string',
                format: 'uuid'
              },
              username: {
                type: 'string'
              }
            }
          }
        }
      },
      MessageResponse: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        required: ['message'],
        properties: {
          message: {
            type: 'string'
          }
        }
      },
      SendContactRequestRequest: {
        type: 'object',
        required: ['recipient_public_id'],
        properties: {
          recipient_public_id: {
            type: 'string',
            example: 'dancing-panda927'
          },
          first_message: {
            type: 'string',
            nullable: true,
            maxLength: 200,
            description: 'Plaintext for MVP; E2E encrypted once Sprint 6 lands.'
          },
          device_specific: {
            type: 'boolean',
            description: 'Accepted for forward-compat with Sprint 11.6; not yet persisted.'
          }
        }
      },
      SubmittedResponse: {
        type: 'object',
        required: ['status'],
        description: 'Uniform anti-enumeration response. Returned for every input to /send.',
        properties: {
          status: {
            type: 'string',
            enum: ['submitted']
          }
        }
      },
      OkResponse: {
        type: 'object',
        required: ['status'],
        properties: {
          status: {
            type: 'string',
            enum: ['ok']
          }
        }
      },
      ContactRequestSummary: {
        type: 'object',
        required: ['id', 'sender_public_id', 'first_message', 'created_at', 'expires_at', 'status'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          sender_public_id: { type: 'string', example: 'dancing-panda927' },
          first_message: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          expires_at: { type: 'string', format: 'date-time' },
          status: { type: 'string', enum: ['pending', 'accepted', 'denied', 'expired'] }
        }
      },
      PendingContactRequestsResponse: {
        type: 'object',
        required: ['requests'],
        properties: {
          requests: {
            type: 'array',
            items: { $ref: '#/components/schemas/ContactRequestSummary' }
          }
        }
      },
      RespondContactRequestRequest: {
        type: 'object',
        required: ['request_id', 'action'],
        properties: {
          request_id: { type: 'string', format: 'uuid' },
          action: { type: 'string', enum: ['accept', 'deny'] }
        }
      },
      BlockContactRequest: {
        type: 'object',
        required: ['target_public_id'],
        properties: {
          target_public_id: { type: 'string', example: 'dancing-panda927' },
          request_id: {
            type: 'string',
            format: 'uuid',
            description: 'If present, also denies the associated pending request.'
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Check API and database health',
        description: 'Public endpoint used by Sprint 1 QA. No API key or bearer token is required.',
        responses: {
          200: {
            description: 'Service is healthy.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                }
              }
            }
          },
          503: {
            description: 'Service is reachable but degraded.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                }
              }
            }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new account',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AuthRequest'
              }
            }
          }
        },
        responses: {
          201: {
            description: 'Account, device, and session created.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthSuccessResponse'
                }
              }
            }
          },
          400: {
            description: 'Validation failure.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          401: {
            description: 'Missing API key.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          403: {
            description: 'Invalid API key.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          409: {
            description: 'Username already taken.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with username and password',
        security: [{ ApiKeyAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/AuthRequest'
              }
            }
          }
        },
        responses: {
          200: {
            description: 'Login successful.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/AuthSuccessResponse'
                }
              }
            }
          },
          400: {
            description: 'Missing username or password.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          401: {
            description: 'Missing API key or invalid credentials.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          403: {
            description: 'Invalid API key.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out the current session',
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        responses: {
          200: {
            description: 'Session cleared or already absent.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MessageResponse'
                }
              }
            }
          },
          401: {
            description: 'Missing or invalid bearer token.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          403: {
            description: 'Invalid API key.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/auth/session': {
      get: {
        tags: ['Auth'],
        summary: 'Inspect the authenticated session context',
        description:
          'QA helper endpoint for Sprint 2. Returns the session data attached by requireSessionAuth so bearer-auth middleware can be verified directly.',
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        responses: {
          200: {
            description: 'Authenticated session context.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/SessionContextResponse'
                }
              }
            }
          },
          401: {
            description: 'Missing or invalid bearer token.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          },
          403: {
            description: 'Invalid API key.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ErrorResponse'
                }
              }
            }
          }
        }
      }
    },
    '/contact-request/send': {
      post: {
        tags: ['Contact'],
        summary: 'Send a contact request by exact Public-ID',
        description:
          'Always returns 202 { status: "submitted" }, regardless of whether the Public-ID is ' +
          'invalid, unknown, reserved, deprecated, confusable, or belongs to someone who has ' +
          'blocked the caller. This uniformity is a hard anti-enumeration requirement, not a bug.',
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        parameters: [
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: false,
            schema: { type: 'string', format: 'uuid' },
            description: 'Client-generated UUID. Replaying the same key returns the identical response.'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SendContactRequestRequest' }
            }
          }
        },
        responses: {
          202: {
            description: 'Submitted (uniform for all inputs).',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SubmittedResponse' }
              }
            }
          },
          401: {
            description: 'Missing or invalid bearer token.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/contact-request/pending': {
      get: {
        tags: ['Contact'],
        summary: 'List pending incoming contact requests',
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        responses: {
          200: {
            description: 'Pending requests addressed to the authenticated account.',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/PendingContactRequestsResponse' }
              }
            }
          },
          401: {
            description: 'Missing or invalid bearer token.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/contact-request/respond': {
      post: {
        tags: ['Contact'],
        summary: 'Accept or deny a pending contact request',
        description:
          'Always returns 200 { status: "ok" }, whether or not request_id referred to a request ' +
          'actually owned by the caller and still pending.',
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        parameters: [
          {
            name: 'Idempotency-Key',
            in: 'header',
            required: false,
            schema: { type: 'string', format: 'uuid' }
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/RespondContactRequestRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Acknowledged (uniform).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } }
          },
          401: {
            description: 'Missing or invalid bearer token.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    },
    '/contact-request/block': {
      post: {
        tags: ['Contact'],
        summary: 'Block a contact by Public-ID',
        description:
          'Always returns 200 { status: "ok" }. The blocked party receives no signal. If ' +
          'request_id is supplied, the associated pending request is also denied.',
        security: [{ ApiKeyAuth: [], BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/BlockContactRequest' }
            }
          }
        },
        responses: {
          200: {
            description: 'Acknowledged (uniform).',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/OkResponse' } } }
          },
          400: {
            description: 'target_public_id missing.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          },
          401: {
            description: 'Missing or invalid bearer token.',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
          }
        }
      }
    }
  }
});
