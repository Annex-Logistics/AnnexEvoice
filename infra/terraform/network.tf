resource "google_compute_network" "vpc" {
  name                    = "annexevoice-${var.env}"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name          = "annexevoice-${var.env}"
  region        = var.region
  network       = google_compute_network.vpc.self_link
  ip_cidr_range = "10.80.0.0/20"
}

resource "google_compute_address" "static_ip" {
  name   = "annexevoice-${var.env}"
  region = var.region
}

resource "google_compute_firewall" "allow_http" {
  name    = "annexevoice-${var.env}-http"
  network = google_compute_network.vpc.self_link
  allow {
    protocol = "tcp"
    ports    = ["80", "443"]
  }
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["annexevoice-vm"]
}

# SSH only via IAP; no public SSH.
resource "google_compute_firewall" "allow_iap_ssh" {
  name    = "annexevoice-${var.env}-iap-ssh"
  network = google_compute_network.vpc.self_link
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  source_ranges = ["35.235.240.0/20"]
  target_tags   = ["annexevoice-vm"]
}
