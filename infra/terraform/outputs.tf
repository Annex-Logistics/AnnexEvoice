output "vm_ip" { value = google_compute_address.static_ip.address }
output "artifact_registry" { value = google_artifact_registry_repository.images.name }
output "deploy_sa" { value = google_service_account.deploy.email }
