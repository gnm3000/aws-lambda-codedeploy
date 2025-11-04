# 🧩 Pull Request — Continuous Reflection Template

> _"Each PR is a hypothesis on how to improve the system without breaking it."_  

## 1️⃣ Context
Briefly describe **what problem this PR solves** and **why this change matters**.  
Example: “This service was causing queue latency in SQS; optimized the handler and added an E2E test.”

---

## 2️⃣ Change Scope
- [ ] Small (safe deploy under 30 minutes)
- [ ] Medium (needs peer review)
- [ ] High-risk (coordinate rollback plan)

---

## 3️⃣ Technical Reflection
Answer concisely:
- What did I **learn** while implementing this?
- What assumption did I **validate or invalidate**?
- How did this change **improve readability, modularity, or resilience**?

---

## 4️⃣ Quality Checklist

### ✅ CI/CD and Tests
- [ ] All unit tests pass
- [ ] Added or updated **E2E test** for the new feature
- [ ] CI/CD pipeline (`.github/workflows/`) runs cleanly
- [ ] No public microservice contract was broken

### ⚙️ Micro-Deploy Readiness
- [ ] PR is **small and atomic**
- [ ] Includes at least one **minor fix or improvement**
- [ ] Can be safely deployed multiple times per day

---

## 5️⃣ Post-Merge Learning
- [ ] Documented what I learned (README, Notion, or internal doc)
- [ ] Created a follow-up issue or refactor suggestion
- [ ] Shared the insight with the team

---

💡 *Reminder:*  
Reflect before you merge.  
If nothing was learned, the PR was likely too automatic — or too big.

