terraform {
  backend "s3" {
    bucket         = "saleszium-tf-state"
    key            = "envs/beta/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}
