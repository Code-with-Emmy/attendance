-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create EmployeeFaceEmbedding table with vector type
CREATE TABLE "EmployeeFaceEmbedding" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "employeeId" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "embedding" vector(128) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeFaceEmbedding_pkey" PRIMARY KEY ("id")
);

-- Add foreign key constraints
ALTER TABLE "EmployeeFaceEmbedding" ADD CONSTRAINT "EmployeeFaceEmbedding_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EmployeeFaceEmbedding" ADD CONSTRAINT "EmployeeFaceEmbedding_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Create indexes
CREATE INDEX "EmployeeFaceEmbedding_employeeId_idx" ON "EmployeeFaceEmbedding"("employeeId");
CREATE INDEX "EmployeeFaceEmbedding_organizationId_idx" ON "EmployeeFaceEmbedding"("organizationId");
-- IVFFlat or HNSW index for vector searching
CREATE INDEX "EmployeeFaceEmbedding_embedding_idx" ON "EmployeeFaceEmbedding" USING hnsw ("embedding" vector_l2_ops);
