variable "project_id" {
  type = string
  default = "infinitalk-dev"
}

variable "deployment_region" {
  type = string
  default = "us-central1"
}

variable "docker_image" {
    type = string
    default = "gcr.io/infinitalk-dev/dashboard-summarization-docker-repo/websocketserviceimage:test"
}

variable "cloud_run_service_name" {
    type = string
    default = "dashboard-summary-service"
}

variable "GENAI_CLIENT_value" {
  description = "The value for the GENAI_CLIENT"
  type        = string
  sensitive   = true
  default = "test"
}
