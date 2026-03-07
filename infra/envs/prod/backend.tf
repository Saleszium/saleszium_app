terraform {
  backend "s3" {
    bucket         = "saleszium-terraform-state"
    key            = "envs/prod/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
