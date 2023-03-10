Feature: Get Recent Coupons Usecase test

    @ValidateGetRecentCoupons
    Scenario: For a recently added coupon, I should be able to obtain it 
        Given I have the coupon "cuponel" with "RERRO231"
        When I execute getRecentCouponsUsecase
        Then I should receive the recently added coupon

    @ValidateGetRecentCoupons
    Scenario: For no recently added coupon, I should not obtain anything
        Given I have no recently added coupons
        When I execute getRecentCouponsUsecase
        Then I should not receive any coupon