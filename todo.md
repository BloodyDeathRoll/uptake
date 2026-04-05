# suggest meal based on diet + goals + geo location

1. Need to setup admin page and manage all users

2. Add cancel/back to profile update

3. Upsate steps look ok, settings is still a different look - Kepp header on both (logo, settings cog, logout). Align block to top with some padding.

4. Make the deficit/surplus bar the same height as the other bars
lets make the deficit/surplus labels jump up and be shown on the same line as the decifit/surplus value, so the rings block's height is reduced

5. Add an icon for 'today's meals'

6. UX: after editing a meal - whether we save a change, cancel or click back - the app always jumps for today's date, which is confusing if a user checks yesterrday's meal. Lets make sure we save the appropriate date - if I checked a meal I had yesterday and clicked save or cancel - the app takes me back to yesterdays details

7. Add terms and conditions page - create a standard t&C, add add link to settings and create as a standf alone page.

8. Retry microsoft oauth (already set up azure & supabase)

9. Analysis needs to be better detailed - time of day recommendations - whats more important throughout the days for optimal goal achievement

10. Still requires location approval with each login

11. We dont need 2 ctas on meals - make 'save as is' & 'accept all & save' one button titled 'Save', color the cancel link on top as a standard link.

12. Lots of 'had trouble understanding' getting rendered after tries to add meals. The app neads to be able descriptions that are not completely clear. Users should not get this screen. Guestimate whenever you dont have a clear picture. For example, a general description like 'Acai bowl with granola and fruits' should definitely return results, even if your just entering "typical" quantities (currently it doesnt). Pita bread and peanut butter should return results, currently it doesn't.

13. I need to work on a logo (U as fork) - not great currently

14. Add arbs as part of ingredients composition - currently not listed.

15. Add a '100g'/'100ml' button inside the name field of a new ingredient. Once the user enters an ingredient and clicks the amount, fill out the rest of the composition for that default amount. If the user corrects the amount - update.

16. Add tests to value calculations after changing quantities on ingredients - currently there are mistakes if editing the amount after an estimation.

17. There is too much left/right padding for the content on main page mobile - keep same as in edit/add meal screens.

18. Edit meal icon is too close to delete icon. Lets move the delete icon outside the card, to the right.

19. Deletion of a meal should not be a two click operation. When a user click delete - just delete

20. Write test to make sure deletion is working as it should, we had some phantom copies show up after deletion

21. Admin user "last signin" gets cut off. make sure the data does not exceed the line (show '...' on email address ending if too long, and allow users to click and see full address)

22. Admin database 'size on disk' column is empty throughout the table

23. Add a link to the logo - should lead to the main app page, even from the admin page

24. On 'remaining today', add '%' of Calories, protein, carbs and fat (like we have on the analysis page) - sit them above the bars, next to the values on the right, and remove the bottom values surplus/deficit line

25. Change the progress bar coloring for 'remaining today': start with red on 0, move to orange to yellow to green on hitting the mark, and then continue to yellow to orange to red if passing the goal mark. Apply same logic to rings

26. User initals on top right corner are not visible. Contrast.

27. Lets add breakdown for protein, calories, carbs & fat - when a user clicks one on 'remaining today', he gets a list of that days ingredients that contributed to the value. For example: 
<index>
    protein
    <value>120g</value>
    <item_1>
        <meal>Breakfast</meal>
        150g Saiten <value>contributed 100g</value>
    </item_1>
    <item_2>
        <meal>Lunch</meal>
        300g Tofu <value>contributed 20g</value>
    </item_2> 
</index>

28. When clicking on a meal card, ut takes a while untile the data is loaded and presented. Add the loader spinner like we use on switching dates.

29. I need to add svg illustrations to onboarding cards of level of activity and goals

30. Review google gemma 4 - https://blog.google/innovation-and-ai/technology/developers-tools/gemma-4/ - can we use it as an llm on the app?

31. Add photo should have a choice for camera use or device upload every time. Add the add photo img to an ingredient level as well, so a user can scan the ingredients list of a component of a meal
