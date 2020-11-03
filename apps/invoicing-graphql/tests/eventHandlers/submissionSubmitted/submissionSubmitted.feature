Feature: Submission Submitted event handled
  # Submission Submitted event is triggered by review when a user:
  # - submitted a new article for publication
  # - moves an article already submitted from a journal to an other journal
  # - changes the articleType

  Background:
    Given There is a Journal "foo-journal" with APC "200"

  Scenario: Article is submitted for the first time and is invoiceable
    Given A "Research Article" with CustomId "111111" is submitted on journal "foo-journal"
    When The "Submission Submitted" event is triggered
    Then The invoice for CustomId "111111" is created
    And The invoice for CustomId "111111" has price "200"

  Scenario: Article is submitted for the first time and is non-invoiceable
    Given A "Corrigendum" with CustomId "111112" is submitted on journal "foo-journal"
    When The "Submission Submitted" event is triggered
    Then The invoice for CustomId "111112" is not created

  Scenario: Article is re-submitted to an other journal
    Given There is a Journal "bar-journal" with APC "300"
    And A "Research Article" with CustomId "111113" is on "foo-journal"
    And A "Research Article" with CustomId "111113" is submitted on journal "bar-journal"
    When The "Submission Submitted" event is triggered
    Then The invoice for CustomId "111113" has price "300"

  Scenario: Article is re-submitted with other articleType
    Given A "Research Article" with CustomId "111114" is on "foo-journal"
    And A "Corrigendum" with CustomId "111114" is submitted on journal "foo-journal"
    When The "Submission Submitted" event is triggered
    Then The invoice for CustomId "111114" is deleted

  Scenario: Article with with corresponding author as an editor has waiver applied
    Given There is an editor for Journal "foo-journal" with email "editor@test.com"
    And A "Research Article" with CustomId "111115" is submitted on journal "foo-journal"
    And The article with CustomId "111115" has coresponding author with email "editor@test.com" from country "RO"
    When The "Submission Submitted" event is triggered
    Then The invoice for CustomId "111115" has a waiver applied

  Scenario: Article with authot not an editor has no waiver applied
    Given There is an editor for Journal "foo-journal" with email "editor@test.com"
    And A "Research Article" with CustomId "111116" is submitted on journal "foo-journal"
    And The article with CustomId "111116" has coresponding author with email "not_editor@test.com" from country "RO"
    When The "Submission Submitted" event is triggered
    Then The invoice for CustomId "111116" has no waiver applied
