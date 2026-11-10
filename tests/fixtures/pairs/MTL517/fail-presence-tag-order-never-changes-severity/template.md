---
optional_then_required: "draft | accepted" # [presence:optional] [presence:required]
required_then_optional: "draft | accepted" # [presence:required] [presence:optional]
conditional_then_optional: "draft | accepted" # [presence:conditional:when risky] [presence:optional]
conditional_then_required: "draft | accepted" # [presence:conditional:when risky] [presence:required]
required_then_conditional: "draft | accepted" # [presence:required] [presence:conditional:when risky]
optional_then_conditional: "draft | accepted" # [presence:optional] [presence:conditional:when risky]
---
