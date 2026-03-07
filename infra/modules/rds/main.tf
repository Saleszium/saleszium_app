resource "aws_db_subnet_group" "main" {
  name       = "${var.environment}-db-subnet-group"
  subnet_ids = var.subnet_ids

  tags = {
    Name        = "${var.environment}-db-subnet-group"
    Environment = var.environment
  }
}

resource "aws_db_instance" "main" {
  identifier           = "${var.environment}-postgres"
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "15"
  instance_class       = var.db_instance_class
  db_name              = var.db_name
  username             = var.db_username
  password             = var.db_password
  parameter_group_name = "default.postgres15"
  skip_final_snapshot  = true
  publicly_accessible  = true
  vpc_security_group_ids = var.vpc_security_group_ids
  db_subnet_group_name   = aws_db_subnet_group.main.name

  tags = {
    Name        = "${var.environment}-postgres"
    Environment = var.environment
  }
}

# Automatically create the CRM database after RDS is ready
resource "null_resource" "create_crm_db" {
  depends_on = [aws_db_instance.main]

  provisioner "local-exec" {
    command = <<EOT
      PGPASSWORD='${var.db_password}' psql \
        "postgresql://${var.db_username}@${aws_db_instance.main.address}:5432/${var.db_name}?sslmode=require" \
        -c "SELECT 1 FROM pg_database WHERE datname='${var.crm_db_name}'" | grep -q 1 || \
      PGPASSWORD='${var.db_password}' psql \
        "postgresql://${var.db_username}@${aws_db_instance.main.address}:5432/${var.db_name}?sslmode=require" \
        -c "CREATE DATABASE ${var.crm_db_name};"
    EOT
  }
}

