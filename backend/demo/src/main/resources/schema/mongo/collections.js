// Sign Language Translation System

db = db.getSiblingDB("sign_language_db");

// Config
const EMBEDDING_DIM = 128;  // Must match ML model
const PIPELINE_LOG_TTL = 60 * 60 * 24 * 7;  // 7 days
 
// 1. FEATURE DOCS (UC1)
// Linked by: stream_chunks.feature_doc_id
db.createCollection("feature_docs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["chunk_id", "frames"],
      properties: {
        _id: { bsonType: "objectId" },
        chunk_id: { 
          bsonType: "long",
          description: "Reference to PostgreSQL stream_chunks.chunk_id"
        },
        session_id: { bsonType: "long" },

        frames: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["frame_index", "keypoints"],
            properties: {
              frame_index: { bsonType: "int", minimum: 0 },
              timestamp_sec: { bsonType: "double", minimum: 0 },

              keypoints: {
                bsonType: "object",
                required: ["pose", "left_hand", "right_hand"],
                properties: {
                  pose: {
                    bsonType: "array",
                    items: {
                      bsonType: "array",
                      minItems: 3,
                      maxItems: 3,
                      items: { bsonType: "double" }  // [x, y, confidence]
                    }
                  },
                  left_hand: {
                    bsonType: "array",
                    items: {
                      bsonType: "array",
                      minItems: 3,
                      maxItems: 3,
                      items: { bsonType: "double" }
                    }
                  },
                  right_hand: {
                    bsonType: "array",
                    items: {
                      bsonType: "array",
                      minItems: 3,
                      maxItems: 3,
                      items: { bsonType: "double" }
                    }
                  },
                  face: {
                    bsonType: "array",
                    items: {
                      bsonType: "array",
                      minItems: 3,
                      maxItems: 3,
                      items: { bsonType: "double" }
                    }
                  }
                }
              }
            }
          }
        },

        created_at: { bsonType: "date" }
      }
    }
  }
});

db.feature_docs.createIndex({ chunk_id: 1 }, { unique: true });
db.feature_docs.createIndex({ session_id: 1 });
db.feature_docs.createIndex({ created_at: 1 });

// 2. TRANSCRIPT CANDIDATES (UC1)
// Linked by: stream_chunks.chunk_id
// Purpose: Track model output → rule engine → final
db.createCollection("transcript_candidates", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["chunk_id", "stage", "tokens"],
      properties: {
        _id: { bsonType: "objectId" },
        chunk_id: { 
          bsonType: "long",
          description: "Reference to PostgreSQL stream_chunks.chunk_id"
        },
        session_id: { bsonType: "long" },

        // Track progression through pipeline
        stage: {
          enum: ["model_raw", "rule_engine", "final"],
          description: "model_raw=direct from ML, rule_engine=after rules, final=saved to postgres"
        },

        tokens: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["text", "confidence"],
            properties: {
              text: { bsonType: "string" },
              confidence: { 
                bsonType: "double", 
                minimum: 0, 
                maximum: 1 
              },
              // Rules applied at this stage
              applied_rules: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  properties: {
                    rule_name: { bsonType: "string" },  // "merge", "noise_filter"
                    rule_description: { bsonType: "string" }
                  }
                }
              }
            }
          }
        },

        // Optional: full merged text
        merged_text: { bsonType: "string" },

        model_name: { bsonType: "string" },
        model_version: { bsonType: "string" },

        created_at: { bsonType: "date" }
      }
    }
  }
});

db.transcript_candidates.createIndex({ chunk_id: 1 });
db.transcript_candidates.createIndex({ session_id: 1 });
db.transcript_candidates.createIndex({ stage: 1 });
db.transcript_candidates.createIndex({ created_at: 1 });

 
// 3. NLP EXTRACTIONS (UC2)
// Linked by: session_inputs.input_id
// Purpose: Track NLP extraction & mapping decisions
db.createCollection("nlp_extractions", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["input_id", "keywords", "created_at"],
      properties: {
        _id: { bsonType: "objectId" },
        input_id: {
          bsonType: "long",
          description: "Reference to PostgreSQL session_inputs.input_id"
        },
        session_id: { bsonType: "long" },

        // Original input (for audit)
        raw_input: { bsonType: "string" },
        input_type: { 
          enum: ["text", "audio"],
          description: "audio inputs go through STT first"
        },

        // NLP extraction results
        keywords: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["text", "likelihood"],
            properties: {
              text: { bsonType: "string" },
              likelihood: { 
                bsonType: "double",
                minimum: 0,
                maximum: 1
              },

              // Which gestured was selected for this keyword
              selected_gesture_id: { 
                bsonType: "long",
                description: "Reference to gesture_assets.gesture_id"
              },
              
              // Why this gesture was chosen
              selection_reason: {
                enum: ["user_vocab", "exact_match", "fallback", "fuzzy_match"],
                description: "user_vocab=from user_vocabulary, exact_match=direct mapping, fallback=no match found"
              },

              // Alternate candidates (for debugging)
              candidates: {
                bsonType: "array",
                items: {
                  bsonType: "object",
                  properties: {
                    gesture_id: { bsonType: "long" },
                    score: { bsonType: "double" }
                  }
                }
              }
            }
          }
        },

        nlp_model_name: { bsonType: "string" },
        nlp_model_version: { bsonType: "string" },

        created_at: { bsonType: "date" }
      }
    }
  }
});

db.nlp_extractions.createIndex({ input_id: 1 }, { unique: true });
db.nlp_extractions.createIndex({ session_id: 1 });
db.nlp_extractions.createIndex({ created_at: 1 });

 
// 4. GESTURE METADATA (UC2)
// Linked by: gesture_assets.external_meta_id
// Purpose: Rich gesture annotation (heavy payload)
db.createCollection("gesture_metadata", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["gesture_id", "gloss", "embedding"],
      properties: {
        _id: { bsonType: "objectId" },
        gesture_id: {
          bsonType: "long",
          description: "Reference to PostgreSQL gesture_assets.gesture_id"
        },
        gloss: { 
          bsonType: "string",
          description: "Canonical gesture token"
        },
        language_code: { bsonType: "string" },

        // Gesture phonology
        handshape: { bsonType: "string" },
        movement: { bsonType: "string" },
        location: { bsonType: "string" },
        orientation: { bsonType: "string" },

        non_manual_signals: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "Facial expression, mouth shape, etc."
        },

        // ML embedding (for similarity search)
        embedding: {
          bsonType: "array",
          minItems: 128,
          maxItems: 128,
          items: { bsonType: "double" }
        },

        // Annotation
        tags: {
          bsonType: "array",
          items: { bsonType: "string" },
          description: "e.g. ['greeting', 'common', 'formal']"
        },

        difficulty_level: { 
          bsonType: "int", 
          minimum: 1, 
          maximum: 5,
          description: "1=easy, 5=hard"
        },

        version: { bsonType: "int", minimum: 1 },

        created_at: { bsonType: "date" }
      }
    }
  }
});

db.gesture_metadata.createIndex({ gesture_id: 1 }, { unique: true });
db.gesture_metadata.createIndex({ gloss: 1, language_code: 1 });

 
// 5. PIPELINE LOGS (UC2 - NEW)
// Linked by: sign_render_jobs.pipeline_doc_id
// Purpose: Render pipeline execution trace (auto-delete after TTL)
db.createCollection("pipeline_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["job_id", "stages", "created_at"],
      properties: {
        _id: { bsonType: "objectId" },
        job_id: {
          bsonType: "long",
          description: "Reference to PostgreSQL sign_render_jobs.job_id"
        },

        stages: {
          bsonType: "array",
          minItems: 1,
          items: {
            bsonType: "object",
            required: ["stage_name", "status", "timestamp"],
            properties: {
              stage_name: { 
                bsonType: "string",
                description: "e.g. NLP, Mapping, Rendering, Encoding"
              },

              status: {
                enum: ["started", "processing", "done", "failed"]
              },

              input_snapshot: { 
                bsonType: "object",
                description: "Input state to this stage"
              },
              
              output_snapshot: { 
                bsonType: "object",
                description: "Output state from this stage"
              },

              error: { bsonType: "string" },
              error_code: { bsonType: "string" },

              duration_ms: { bsonType: "long" },

              timestamp: { bsonType: "date" }
            }
          }
        },

        created_at: { bsonType: "date" }
      }
    }
  }
});

db.pipeline_logs.createIndex({ job_id: 1 });
db.pipeline_logs.createIndex({ created_at: 1 });

// Auto-delete pipeline logs after TTL
db.pipeline_logs.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: PIPELINE_LOG_TTL }
);

 
// 6. RULE ENGINE LOGS (OPTIONAL - debugging)
// Purpose: Track which rules were applied and their effect
db.createCollection("rule_engine_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["session_id", "use_case", "applied_rules"],
      properties: {
        _id: { bsonType: "objectId" },
        session_id: { bsonType: "long" },
        
        use_case: { 
          enum: ["sign_to_text", "text_to_sign"]
        },

        // Input to rule engine
        input: { bsonType: "object" },

        // Rules applied
        applied_rules: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["rule_name"],
            properties: {
              rule_name: { 
                bsonType: "string",
                description: "e.g. 'grammar_fix', 'merge_tokens', 'noise_filter', 'user_vocab_priority'"
              },
              before: { bsonType: "string" },
              after: { bsonType: "string" },
              confidence_impact: { bsonType: "double" },
              timestamp: { bsonType: "date" }
            }
          }
        },

        // Final output
        output: { bsonType: "object" },

        total_rules_applied: { bsonType: "int" },
        total_duration_ms: { bsonType: "long" },

        created_at: { bsonType: "date" }
      }
    }
  }
});

db.rule_engine_logs.createIndex({ session_id: 1 });
db.rule_engine_logs.createIndex({ use_case: 1 });
db.rule_engine_logs.createIndex({ created_at: 1 });

// Auto-delete after 30 days
db.rule_engine_logs.createIndex(
  { created_at: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 30 }
);

/**
 
// SAMPLE DOCUMENTS
 

// feature_docs sample
db.feature_docs.insertOne({
  chunk_id: NumberLong(1),
  session_id: NumberLong(1),
  frames: [
    {
      frame_index: 0,
      timestamp_sec: 0.0,
      keypoints: {
        pose: [[0.1, 0.2, 0.9], [0.15, 0.25, 0.85]],
        left_hand: [[0.2, 0.3, 0.95]],
        right_hand: [[0.3, 0.3, 0.90]],
        face: [[0.15, 0.1, 0.92]]
      }
    }
  ],
  created_at: new Date()
});

// transcript_candidates sample (UC1)
db.transcript_candidates.insertOne({
  chunk_id: NumberLong(1),
  session_id: NumberLong(1),
  stage: "model_raw",
  tokens: [
    { text: "hello", confidence: 0.92, applied_rules: [] },
    { text: "hi", confidence: 0.88, applied_rules: [] }
  ],
  model_name: "gesture-recognition-v1",
  model_version: "1.0.0",
  created_at: new Date()
});

// nlp_extractions sample (UC2)
db.nlp_extractions.insertOne({
  input_id: NumberLong(1),
  session_id: NumberLong(1),
  raw_input: "Xin chào",
  input_type: "text",
  keywords: [
    {
      text: "chào",
      likelihood: 0.95,
      selected_gesture_id: NumberLong(5),
      selection_reason: "exact_match",
      candidates: [
        { gesture_id: NumberLong(5), score: 0.95 },
        { gesture_id: NumberLong(12), score: 0.88 }
      ]
    }
  ],
  nlp_model_name: "bert-vietnamese-v1",
  nlp_model_version: "1.0.0",
  created_at: new Date()
});

// gesture_metadata sample
db.gesture_metadata.insertOne({
  gesture_id: NumberLong(5),
  gloss: "hello",
  language_code: "vi",
  handshape: "flat",
  movement: "wave",
  location: "chest",
  orientation: "outward",
  non_manual_signals: ["smile"],
  embedding: Array(128).fill(0).map(() => Math.random()),
  tags: ["greeting", "common"],
  difficulty_level: 2,
  version: 1,
  created_at: new Date()
});


// pipeline_logs sample
db.pipeline_logs.insertOne({
  job_id: NumberLong(1),
  stages: [
    {
      stage_name: "NLP",
      status: "done",
      input_snapshot: { text: "Xin chào" },
      output_snapshot: { keywords: ["chào"] },
      duration_ms: 150,
      timestamp: new Date()
    }
  ],
  created_at: new Date()
});
*/
