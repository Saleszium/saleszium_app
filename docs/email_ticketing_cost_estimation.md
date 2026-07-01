# AWS Cost Estimation: Email Ticketing Service
**Region:** Asia Pacific (Mumbai) `ap-south-1`  
**Architecture:** Amazon SES (Email Receiving/Sending) + AWS Lambda (Processor/Webhook) + Amazon S3 (Email/Attachment Storage)

---

## 📊 Summary of AWS Pricing Rates (Mumbai Region)

The table below details the current pay-as-you-go pricing rates in `ap-south-1` along with any applicable AWS Free Tier credits.

| Service | Component | Pricing Rate (ap-south-1) | Free Tier Allowance (Per Month) |
| :--- | :--- | :--- | :--- |
| **Amazon SES** | **Inbound Receiving** | **$0.10** per 1,000 emails | 3,000 message charges free (first 12 months) |
| | **Outbound Sending** | **$0.10** per 1,000 emails | 3,000 message charges free (first 12 months) |
| | **Inbound Data (Size)** | **$0.09** per 1,000 additional 256 KB chunks (after first 256 KB) | None |
| **AWS Lambda** | **Requests** | **$0.20** per 1 million requests | 1 million requests (permanent) |
| | **Compute Duration** | **$0.0000166667** per GB-second (x86) | 400,000 GB-seconds (permanent) |
| **Amazon S3** | **Storage (S3 Standard)**| **$0.025** per GB | 5 GB (first 12 months) |
| | **PUT / POST / LIST** | **$0.005** per 1,000 requests | 2,000 requests (first 12 months) |
| | **GET / SELECT** | **$0.0004** per 1,000 requests | 20,000 requests (first 12 months) |
| **AWS Data Transfer**| **Data Transfer Out** | **$0.12** per GB (after first 100 GB) | 100 GB Data Transfer Out (permanent) |

---

## 🧮 Scenario Cost Calculation

### Workload Assumptions:
*   **Monthly Tickets:** 50,000 received tickets.
*   **Total Email Traffic:** 100,000 emails (50,000 Inbound + 50,000 Outbound replies).
*   **Average Email Size (including attachments/images):** 1 MB.
*   **Total Stored Data:** 100 GB per month.

### Detailed Calculations:

1. **Amazon SES Inbound:**
   *   *Base Cost:* $0.10 × (50,000 / 1,000) = **$5.00**
   *   *Size Surcharge:* For a 1 MB (1,024 KB) email, the first 256 KB is free. The remaining 768 KB equates to **3 additional chunks of 256 KB** per email.
     $$\text{Surcharge} = 50,000 \text{ emails} \times 3 \text{ chunks} \times \frac{\$0.09}{1,000} = \mathbf{\$13.50}$$
   *   *Total Inbound Cost:* $5.00 + $13.50 = **$18.50**

2. **Amazon SES Outbound:**
   *   *Base Cost:* $0.10 × (50,000 / 1,000) = **$5.00**
   *   *Total Outbound Cost:* **$5.00**

3. **AWS Lambda Compute:**
   *   *Total Executions:* 100,000 executions (50k inbound hooks + 50k outbound hooks).
   *   *Request Surcharges:* 100,000 requests is fully covered by the 1,000,000 free request tier (**$0.00**).
   *   *Duration Surcharges:* At 512 MB memory and 1 second run duration per execution:
     $$\text{Total Duration} = 100,000 \text{ runs} \times 1 \text{ sec} \times 0.5 \text{ GB} = 50,000 \text{ GB-seconds}$$
     Since 50,000 GB-seconds is well below the 400,000 GB-seconds free tier, duration cost is **$0.00**.

4. **Amazon S3 Storage & Operations:**
   *   *Storage (100 GB):* 100 GB × $0.025 = **$2.50** (Mumbai standard storage rate)
   *   *PUT Requests:* 100,000 writes × ($0.005 / 1,000) = **$0.50**
   *   *GET Requests (estimated 100k views):* 100,000 reads × ($0.0004 / 1,000) = **$0.04**
   *   *Total S3 Cost:* $2.50 + $0.50 + $0.04 = **$3.04**

5. **Data Transfer Out:**
   *   50,000 outbound emails × 1 MB = 50 GB Data Transfer Out.
   *   Because AWS offers a permanent **100 GB free tier for internet egress**, data transfer out cost is **$0.00**.

---

### Monthly Cost Summary Table

| Component | Cost (With Free Tier) | Cost (Without Free Tier) |
| :--- | :--- | :--- |
| **SES Inbound** | $18.50 | $18.50 |
| **SES Outbound** | $5.00 | $5.00 |
| **AWS Lambda** | $0.00 | $0.85 |
| **Amazon S3** | $3.04 | $3.04 |
| **AWS Data Transfer Out** | $0.00 | $6.00 |
| **Total Monthly Cost** | **$26.54** (Approx. ₹2,210 INR) | **$33.39** (Approx. ₹2,780 INR) |

---

## 💡 Production Architecture & Optimization Tips

### 1. Configure S3 Lifecycle Policies
Unoptimized S3 standard storage fees accrue month-over-month as older data accumulates. Set an S3 Lifecycle rule to transition or archive items:
*   **After 30 days:** Transition emails and attachments from **S3 Standard** to **S3 Glacier Instant Retrieval** (reduces storage cost by ~80% with millisecond access).
*   **After 90 days:** Transition to **S3 Glacier Deep Archive** (reduces storage cost by ~96% to $0.00099 per GB).

### 2. AWS Lambda Architecture
Configure your Lambda execution environment to run on **ARM64 (Graviton2)** instead of x86. AWS Lambda Graviton2 duration rates are ~20% cheaper than x86 rates, leading to further duration savings once you exceed the free tier.

### 3. Networking Surcharge (NAT Gateway)
If your Lambda function processes database connections located inside a private subnet (such as an Amazon RDS Postgres instance), you must place the Lambda inside your private VPC.
*   **VPC Placement Surcharge:** Placemant inside a private subnet requires traffic headed to public APIs (e.g. SES endpoints or webhook endpoints) to route through a **NAT Gateway**.
*   **Fixed NAT Gateway Cost:** In Mumbai, running a single NAT Gateway adds a fixed cost of **~$32.85 per month** (plus $0.045 per GB processed).
*   **VPC Endpoint Optimization:** To avoid routing heavy SES and S3 traffic through the NAT Gateway, implement **VPC Endpoints (PrivateLink)** for S3 and SES inside your private VPC. Interface/Gateway VPC endpoints bypass the NAT Gateway, reducing data processing surcharges significantly.
