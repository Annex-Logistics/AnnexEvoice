resource "google_compute_instance" "app" {
  name         = "annexevoice-${var.env}"
  machine_type = var.machine_type
  zone         = var.zone
  tags         = ["annexevoice-vm"]

  boot_disk {
    initialize_params {
      image = "projects/ubuntu-os-cloud/global/images/family/ubuntu-2404-lts-amd64"
      size  = var.disk_size_gb
      type  = "pd-balanced"
    }
  }

  network_interface {
    subnetwork = google_compute_subnetwork.subnet.self_link
    access_config {
      nat_ip = google_compute_address.static_ip.address
    }
  }

  service_account {
    email  = google_service_account.vm.email
    scopes = ["cloud-platform"]
  }

  metadata_startup_script = file("${path.module}/../scripts/bootstrap-vm.sh")

  shielded_instance_config {
    enable_secure_boot = true
    enable_vtpm        = true
    enable_integrity_monitoring = true
  }
}

resource "google_compute_resource_policy" "weekly_snapshot" {
  name   = "annexevoice-${var.env}-snapshot"
  region = var.region
  snapshot_schedule_policy {
    schedule {
      weekly_schedule {
        day_of_weeks {
          day        = "SUNDAY"
          start_time = "02:00"
        }
      }
    }
    retention_policy {
      max_retention_days    = 30
      on_source_disk_delete = "KEEP_AUTO_SNAPSHOTS"
    }
  }
}
