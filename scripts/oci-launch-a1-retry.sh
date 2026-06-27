#!/usr/bin/env bash
#
# Retry-launch an Always-Free A1.Flex instance until OCI capacity appears.
# Run locally with your own configured OCI CLI (`oci setup config`).
# Leave it running (e.g. overnight) — it fires the launch every RETRY_SECS
# until one succeeds, then stops.
#
# Prereqs:
#   1. Install CLI:  bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"
#   2. Configure:    oci setup config   (creates ~/.oci/config with your API key)
#   3. Fill in the OCIDs below.
#
# How to get each value (run after CLI is configured):
#   COMPARTMENT_OCID : oci iam compartment list   (or use your tenancy/root OCID)
#   AD_NAME          : oci iam availability-domain list   -> the "name" field (e.g. GjDH:AP-MUMBAI-1-AD-1)
#   SUBNET_OCID      : Console -> Networking -> vcn-free -> subnet-20260626-0148 -> copy OCID
#   IMAGE_OCID       : oci compute image list --compartment-id <C> \
#                        --operating-system "Canonical Ubuntu" --operating-system-version "22.04" \
#                        --shape "VM.Standard.A1.Flex"   -> pick the latest aarch64 image id
# ---------------------------------------------------------------------------

set -u

# ---- FILL THESE IN ----
COMPARTMENT_OCID="ocid1.tenancy.oc1..xxxx"      # root/tenancy compartment is fine
AD_NAME="GjDH:AP-MUMBAI-1-AD-1"                  # exact name from availability-domain list
SUBNET_OCID="ocid1.subnet.oc1.ap-mumbai-1.xxxx"
IMAGE_OCID="ocid1.image.oc1.ap-mumbai-1.xxxx"   # MUST be an aarch64 Ubuntu 22.04 image
SSH_KEY_FILE="$HOME/.ssh/ssh-key-2026-06-23.key.pub"  # path to your PUBLIC key
DISPLAY_NAME="rhinon-instance"
OCPUS=4                                          # drop to 1 or 2 if 4 keeps failing
MEMORY_GB=24                                     # keep ratio 6GB per OCPU (1->6, 2->12, 4->24)
BOOT_GB=50
RETRY_SECS=60                                    # how long to wait between attempts
# -----------------------

SSH_KEY="$(cat "$SSH_KEY_FILE")"
attempt=0

echo "Hammering A1.Flex launch (${OCPUS} OCPU / ${MEMORY_GB} GB) every ${RETRY_SECS}s. Ctrl-C to stop."

while true; do
  attempt=$((attempt + 1))
  ts="$(date '+%Y-%m-%d %H:%M:%S')"
  echo "[$ts] attempt #$attempt ..."

  if oci compute instance launch \
        --availability-domain "$AD_NAME" \
        --compartment-id "$COMPARTMENT_OCID" \
        --shape "VM.Standard.A1.Flex" \
        --shape-config "{\"ocpus\": $OCPUS, \"memoryInGBs\": $MEMORY_GB}" \
        --image-id "$IMAGE_OCID" \
        --subnet-id "$SUBNET_OCID" \
        --assign-public-ip true \
        --display-name "$DISPLAY_NAME" \
        --boot-volume-size-in-gbs "$BOOT_GB" \
        --metadata "{\"ssh_authorized_keys\": \"$SSH_KEY\"}" \
        --wait-for-state RUNNING 2>/tmp/oci-launch-err.log; then
    echo "[$(date '+%H:%M:%S')] SUCCESS after $attempt attempts — instance is RUNNING."
    exit 0
  fi

  if grep -qi "Out of capacity" /tmp/oci-launch-err.log; then
    echo "    out of capacity — retrying in ${RETRY_SECS}s"
  else
    echo "    NON-capacity error — stopping so you can read it:"
    cat /tmp/oci-launch-err.log
    exit 1
  fi
  sleep "$RETRY_SECS"
done
