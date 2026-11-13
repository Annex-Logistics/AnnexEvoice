resource "google_storage_bucket" "invoices_pdf" {
  name                        = "annexevoice-${var.env}-invoices-pdf"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false
  versioning { enabled = true }
}

resource "google_storage_bucket" "backups" {
  name                        = "annexevoice-${var.env}-backups"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false
  lifecycle_rule {
    action { type = "Delete" }
    condition { age = 90 }
  }
}

resource "google_artifact_registry_repository" "images" {
  repository_id = "annexevoice"
  location      = var.region
  format        = "DOCKER"
  description   = "AnnexEvoice container images"
}
