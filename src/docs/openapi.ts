/**
 * @swagger
 * components:
 *   schemas:
 *     CreateOrderItem:
 *       type: object
 *       required:
 *         - productId
 *         - quantity
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *         quantity:
 *           type: integer
 *           minimum: 1
 *         customizations:
 *           type: array
 *           items:
 *             type: string
 *         kitchenNote:
 *           type: string
 *     CreateOrderRequest:
 *       type: object
 *       required:
 *         - shift
 *         - scheduledFor
 *         - items
 *       properties:
 *         shift:
 *           type: string
 *           enum: [MORNING, AFTERNOON, NIGHT]
 *         scheduledFor:
 *           type: string
 *           format: date
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CreateOrderItem'
 *     CancelOrderResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         status:
 *           type: string
 *           enum: [CANCELLED]
 *         creditedToWallet:
 *           type: boolean
 *     OrderSummary:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         shift:
 *           type: string
 *           enum: [MORNING, AFTERNOON, NIGHT]
 *         scheduledFor:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [PENDING, IN_PREPARATION, READY, DELIVERED, CANCELLED]
 *         total:
 *           type: number
 *           format: float
 *         creditedToWallet:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     ListOrdersResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderSummary'
 *     MeProfileResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         email:
 *           type: string
 *         fullName:
 *           type: string
 *         role:
 *           type: string
 *           enum: [ADMIN, STAFF, STUDENT, DELEGATE, PARENT]
 *         isBeneficiary:
 *           type: boolean
 *         walletBalance:
 *           type: number
 *           format: float
 *         courseId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *     MainAppProduct:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         description:
 *           type: string
 *           nullable: true
 *         price:
 *           type: number
 *           format: float
 *         originalPrice:
 *           type: number
 *           format: float
 *         isOfficialMenu:
 *           type: boolean
 *     MainAppProductsResponse:
 *       type: object
 *       properties:
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/MainAppProduct'
 *     OrderDetailItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         name:
 *           type: string
 *           nullable: true
 *         description:
 *           type: string
 *           nullable: true
 *         isOfficialMenu:
 *           type: boolean
 *         quantity:
 *           type: integer
 *         unitPrice:
 *           type: number
 *           format: float
 *         lineTotal:
 *           type: number
 *           format: float
 *         customizations:
 *           type: array
 *           items:
 *             type: string
 *         kitchenNote:
 *           type: string
 *           nullable: true
 *     OrderDetailResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         shift:
 *           type: string
 *           enum: [MORNING, AFTERNOON, NIGHT]
 *         scheduledFor:
 *           type: string
 *           format: date
 *         status:
 *           type: string
 *           enum: [PENDING, IN_PREPARATION, READY, DELIVERED, CANCELLED]
 *         subtotal:
 *           type: number
 *           format: float
 *         total:
 *           type: number
 *           format: float
 *         cancellationDeadline:
 *           type: string
 *           format: date-time
 *         creditedToWallet:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/OrderDetailItem'
 */
export const openApiSchemas = true;
