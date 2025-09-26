# 🎯 Prometheus MCP - Gerçek Kullanım Örnekleri

Bu dokümanda, Prometheus MCP sisteminin günlük geliştirme sürecinde nasıl kullanıldığına dair **gerçek senaryolar** ve **best practices** bulacaksınız.

## 🌅 Günlük Workflow Örnekleri

### Güne Başlama Rutini

**❌ Önceden (MCP olmadan):**
```
👤 "Bu projede authentication nasıl çalışıyordu?"
🤖 "Bu proje hakkında bilgim yok. Lütfen dosyaları gösterin."
👤 *15 dakika dosya okutma ve açıklama*
```

**✅ Şimdi (MCP ile):**
```
👤 "Bu CPC projemde kaldığım yerden devam edeyim"

🤖 "CPC projenizde son olarak Form Builder sistemi üzerinde
    çalıştınız. FullScreenFormBuilder.js ve FormBuilder.js dosyaları
    25 Eylül'de güncellendi. 85,391 dosyalı Next.js + Redux tabanlı
    multi-tenant belgelendirme platformu. Authentication JWT+Redis,
    MongoDB veritabanı kullanıyor. Aktif task: Form validation
    sistemi implementasyonu."
```

### Context Window Dolduğunda

**Senaryo:** 200K token'lık uzun geliştirme session'ı sonrası

**❌ Önceden:**
```
👤 "Context doldu, nerede kalmıştık?"
🤖 "Context temizlendi. Proje hakkında tekrar bilgi verin."
👤 *Tüm context'i baştan anlatma*
```

**✅ Şimdi:**
```
👤 "Context doldu, nerede kalmıştık?"
🤖 (MCP otomatik devreye girer)
    "Form Builder sisteminde validation logic'i üzerinde
    çalışıyordunuz. Yup schema validation implementasyonu
    yarıda kalmış. Son commit'te ComponentPalette.js'de
    drag-drop functionality eklemiştiniz."
```

## 🔍 Kod Arama Senaryoları

### Özellik Araştırması

**Task:** "Authentication middleware'ini bulup analiz et"

```
👤 "Authentication middleware nerede ve nasıl çalışıyor?"

🤖 (MCP search_project_knowledge)
   "CPC projenizde authentication middleware:

   📁 server/src/middleware/auth.js (Main middleware)
   - JWT token validation
   - Redis session check
   - Multi-tenant isolation

   📁 server/src/middleware/rateLimiter.js
   - Request limiting per tenant

   📁 dashboard/lib/auth.js (Client-side)
   - Token storage and refresh logic

   🔧 Implementation: JWT + Redis sessions, role-based access"
```

### Component Bulma

**Task:** "Form validation components"

```
👤 "Form validation components nerede?"

🤖 (MCP akıllı arama)
   "Form validation components:

   📄 dashboard/components/form-builder/FormBuilder.js
      - Yup schema validation
      - Real-time error display

   📄 dashboard/components/form-builder/PropertyPanel.js
      - Field validation rules
      - Custom validator setup

   📄 dashboard/utils/validation.js
      - Common validation schemas
      - Multi-language error messages"
```

## 🏗️ Development Kararları Kaydetme

### Architectural Decision Recording

**Senaryo:** State management kararı verme

```
👤 "Form Builder'da state management için Redux Toolkit kullanacağım"

🤖 "Bu kararı proje hafızasına kaydediyorum..."

# MCP otomatik olarak şunu kaydeder:
update_project_context({
  type: "decision",
  content: "Form Builder state management için Redux Toolkit seçildi.
           Sebep: Kompleks form state'leri, time-travel debugging
           ve mevcut dashboard Redux struktuürü ile uyum.",
  tags: ["architecture", "state-management", "redux", "form-builder"],
  timestamp: "2025-09-25T..."
})
```

### Task Completion Logging

```
👤 "Form validation sistemi tamamlandı, Yup schemas implement ettim"

🤖 "Tamamlanma kaydediliyor..."

# MCP otomatik kayıt:
update_project_context({
  type: "completion",
  content: "Form Builder validation sistemi tamamlandı.
           Yup library ile dynamic schema generation,
           real-time validation feedback implementasyonu.",
  tags: ["feature-complete", "validation", "yup", "form-builder"]
})
```

## 🧩 Multi-Project Workflow

### Proje Arası Geçiş

**Senaryo:** Aynı gün içinde 3 farklı projede çalışma

```bash
# Proje 1: E-commerce
cd ~/Projects/ecommerce-platform
claude

👤 "Bu projede payment integration nasıl yapılmış?"
🤖 (MCP - ecommerce context) "Stripe + PayPal integration
   var. server/payment/ klasöründe webhook handlers..."

# Proje 2: CPC
cd ~/Projects/cpc
claude

👤 "Bu projede payment integration var mı?"
🤖 (MCP - CPC context) "CPC projesi belgelendirme platformu,
   payment integration yok. Subscription model planning
   aşamasında..."

# Proje 3: Mobile App
cd ~/Projects/mobile-app
claude

👤 "Bu projede authentication nasıl?"
🤖 (MCP - mobile context) "React Native + Firebase Auth
   kullanılıyor. AsyncStorage'da token management..."
```

Her proje için **ayrı hafıza**, hiç karışıklık yok!

## 📊 Development Status Tracking

### Weekly Review

**Senaryo:** Haftalık progress review

```
👤 "Son 7 günde ne yaptım, bu hafta hangi task'lar kaldı?"

🤖 (MCP get_development_status)
   "📅 Son 7 Gün - Development Summary:

   ✅ Tamamlanan:
   - Form Builder UI components (ComponentPalette, DesignCanvas)
   - Drag & drop functionality
   - Real-time preview system

   🔄 Devam Eden:
   - Form validation schemas (Yup integration) - %70
   - Template management system - %40

   📝 Aktif Todos:
   1. Form submission handling
   2. Template sharing functionality
   3. Mobile responsive design

   🎯 Next Steps:
   - Complete validation system
   - API integration for form templates
   - User acceptance testing"
```

### Sprint Planning

```
👤 "Bu sprint'te hangi feature'ları tamamlayabilirim?"

🤖 (MCP context-aware planning)
   "Mevcut development velocity'inize göre:

   🎯 Sprint Önerisi (2 hafta):

   High Priority:
   ✅ Form validation system (3 gün) - zaten %70
   ✅ Template CRUD operations (2 gün) - existing API var

   Medium Priority:
   📱 Mobile responsive forms (3 gün)
   🔗 Form sharing functionality (2 gün)

   Nice to Have:
   📊 Form analytics dashboard (4 gün)

   Toplam: ~14 gün (realistic for 2-week sprint)"
```

## 🔧 Debugging & Troubleshooting

### Bug Investigation

**Senaryo:** Production'da form submission sorunu

```
👤 "Form submission çalışmıyor, nerede sorun olabilir?"

🤖 (MCP search + context)
   "Form submission flow analizi:

   📁 Frontend:
   dashboard/components/form-builder/FormBuilder.js:156
   - onSubmit handler: POST /api/forms/submit

   📁 Backend:
   server/src/controllers/formController.js:89
   - validateFormData() function
   - MongoDB save operation

   🚨 Possible Issues:
   1. Validation schema mismatch (recent Yup update)
   2. MongoDB connection timeout (Redis session expire)
   3. File upload size limits (Multer config)

   🔍 Debug Steps:
   1. Check browser network tab
   2. Server logs: pm2 logs form-service
   3. MongoDB connection: db.forms.stats()"
```

### Performance Investigation

```
👤 "Dashboard yavaş açılıyor, neden?"

🤖 (MCP project analysis)
   "Performance analysis - CPC Dashboard:

   📊 File Size Analysis:
   - bundle.js: ~2.3MB (büyük!)
   - Ant Design: ~800KB
   - Redux state: 156KB (form templates cached)

   🐌 Suspected Bottlenecks:
   1. Form templates pre-loading (85K+ dosya scan)
   2. Bundle size - code splitting eksik
   3. MongoDB aggregation queries (no indexes)

   💡 Optimization Suggestions:
   - Lazy load form templates
   - Implement React.lazy() for routes
   - Add MongoDB compound indexes
   - Enable gzip compression"
```

## 🎨 Creative Problem Solving

### Architecture Refactoring

**Senaryo:** Büyük refactoring kararı

```
👤 "Form Builder'ı microservice'e çevirsem nasıl olur?"

🤖 (MCP architectural context)
   "Microservice geçiş analizi:

   📐 Mevcut Monolith:
   - Forms tightly coupled with User/Auth
   - MongoDB shared schemas
   - Real-time preview needs WebSocket

   🏗️ Microservice Design:

   Service 1: Form Builder Service
   - Port: 4001
   - Database: MongoDB (forms collection)
   - API: REST + GraphQL

   Service 2: Template Service
   - Port: 4002
   - Database: MongoDB (templates)
   - Cache: Redis

   🔗 Integration Points:
   - Auth service communication
   - Event-driven architecture (RabbitMQ/Kafka)
   - API Gateway (nginx/kong)

   ⚖️ Trade-offs:
   ✅ Better scalability
   ✅ Independent deployment
   ❌ Network latency
   ❌ Increased complexity

   🎯 Recommendation: Start with modularization first"
```

## 🚀 Advanced Workflows

### Feature Flag Management

```
👤 "Form Builder beta feature'ı sadece premium user'lara açalım"

🤖 (MCP planning + context)
   "Feature flag implementation:

   🏗️ Infrastructure:
   - Redis-based feature flags (existing Redis)
   - User role check (existing RBAC)
   - Component-level rendering control

   📁 Implementation Files:
   - server/src/middleware/featureFlags.js
   - dashboard/hooks/useFeatureFlag.js
   - dashboard/components/form-builder/index.js

   📝 Code Structure:
   const isFormBuilderEnabled = useFeatureFlag('form-builder-beta', user);

   🎯 Rollout Strategy:
   1. Internal testing (admin role)
   2. Premium users (subscription check)
   3. Gradual rollout (percentage-based)
   4. Full release"
```

### API Versioning Strategy

```
👤 "Form API'sini v2'ye upgrade edeceğim, backward compatibility nasıl?"

🤖 (MCP API context)
   "API Versioning Strategy - Form Endpoints:

   📋 Current API (v1):
   - POST /api/forms/create
   - GET /api/forms/:id
   - PUT /api/forms/:id

   🔄 Proposed API (v2):
   - POST /api/v2/forms (new validation schema)
   - GET /api/v2/forms/:id (includes metadata)
   - PATCH /api/v2/forms/:id (partial updates)

   🔗 Migration Strategy:
   1. Parallel API versions (v1 + v2)
   2. Request header versioning
   3. Database schema compatibility layer
   4. Client-side gradual migration
   5. v1 deprecation timeline (6 months)

   📁 Implementation:
   - routes/api/v1/ (existing)
   - routes/api/v2/ (new)
   - middleware/apiVersioning.js"
```

## 💡 Pro Tips & Best Practices

### 1. Günlük Development Notes

```bash
# Her gün sonunda
👤 "Bugün form validation Yup schemas'ını bitirdim.
    Yarın template sharing API'sini yapacağım."

# MCP otomatik kaydeder, yarın hatırlayacak
```

### 2. Decision Documentation

```bash
# Büyük kararları hemen kaydet
👤 "Authentication için Firebase yerine custom JWT kullanacağız"

# Sebepleri de belirt
👤 "Custom JWT seçiminin sebebi: mevcut Redis infrastructure,
    multi-tenant needs, cost considerations"
```

### 3. Learning Notes

```bash
# Öğrendiğin şeyleri kaydet
👤 "Bugün öğrendim: Yup schema nested validation için
    .shape() yerine .object() kullanılmalı"

# MCP sonraki projelerde de hatırlayacak
```

### 4. Code Review Insights

```bash
# Code review feedback'i kaydet
👤 "Code review'da öğrenilen: React useState için functional updates
    kullanmak state batching için daha iyi"
```

### 5. Performance Benchmarks

```bash
# Performance metrikleri kaydet
👤 "Form Builder optimization sonrası: Bundle size 2.3MB'dan 1.8MB'a düştü,
    Initial load time 3.2s'den 2.1s'e indi"
```

## 🎯 Sonuç

Bu örnekler gösteriyor ki Prometheus MCP sistemi:

✅ **Gerçekten zaman tasarrufu sağlıyor** (15 dk → 30 saniye)
✅ **Context kontinuitesi** sağlıyor
✅ **Decision tracking** yapıyor
✅ **Multi-project** support veriyor
✅ **Akıllı kod bulma** yapıyor

**Artık Claude gerçekten projenizi "bilen" bir geliştirme partneri! 🚀**